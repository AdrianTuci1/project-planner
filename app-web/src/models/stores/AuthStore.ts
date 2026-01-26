
import { makeAutoObservable, runInAction } from "mobx";
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    GlobalSignOutCommand,
    GetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { ProjectStore } from "../store";
// Configuration from user provided details
// @ts-ignore
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN; // Custom Domain
// @ts-ignore
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
// @ts-ignore
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;
// @ts-ignore
const REGION = import.meta.env.VITE_AWS_REGION;

// We can keep using env vars as fallbacks or overrides if needed, but per request using provided values
// @ts-ignore
const AWS_REGION = import.meta.env.VITE_AWS_REGION || REGION;

export class AuthStore {
    rootStore: ProjectStore;
    client: CognitoIdentityProviderClient;

    user: any = null;
    isAuthenticated: boolean = false;
    isLoading: boolean = true;
    error: string | null = null;
    pendingOnboardingData: any = JSON.parse(localStorage.getItem('pendingOnboarding') || 'null');

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        this.client = new CognitoIdentityProviderClient({ region: AWS_REGION });
        makeAutoObservable(this);

        // Check for existing session or OAuth callback on load
        this.checkAuth();
    }

    // --- Actions ---

    async login(email: string, password: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const command = new InitiateAuthCommand({
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: CLIENT_ID,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                },
            });

            const response = await this.client.send(command);

            if (response.AuthenticationResult) {
                this.handleAuthSuccess(response.AuthenticationResult);
                await this.fetchUserAttributes(response.AuthenticationResult.AccessToken!);
            } else {
                console.warn("Login response did not contain AuthenticationResult", response);
                throw new Error("Unexpected login response");
            }

        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to login";
                this.isAuthenticated = false;
            });
            throw err;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async register(email: string, password: string, name: string) {
        this.isLoading = true;
        this.error = null;

        try {
            // Retrieve pending onboarding data (if any)
            const onboarding = this.pendingOnboardingData || {};

            // @ts-ignore
            const apiUrl = import.meta.env.VITE_API_BASE_URL;

            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name, onboarding })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Registration failed");
            }

            const data = await response.json();

            // Backend returns { data: { tokens: {...}, user: {...} }, message: "..." }
            const result = data.data;

            if (result.tokens) {
                // Map keys to match handleAuthSuccess expectation (UpperCamelCase)
                const authResult = {
                    AccessToken: result.tokens.AccessToken,
                    RefreshToken: result.tokens.RefreshToken,
                    IdToken: result.tokens.IdToken,
                    ExpiresIn: result.tokens.ExpiresIn
                };
                this.handleAuthSuccess(authResult);
            }

            // Update user state immediately with returned data
            runInAction(() => {
                this.user = result.user;
                if (this.pendingOnboardingData) {
                    this.clearPendingOnboarding();
                }
            });

            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to register";
            });
            throw err;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async resetPassword(email: string) {
        this.isLoading = true;
        this.error = null;

        try {
            // @ts-ignore
            const apiUrl = import.meta.env.VITE_API_BASE_URL;

            const response = await fetch(`${apiUrl}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error("Failed to reset password");
            }

            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to reset password";
            });
            throw err;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async logout() {
        this.isLoading = true;
        try {
            const accessToken = localStorage.getItem("accessToken");
            if (accessToken) {
                const command = new GlobalSignOutCommand({
                    AccessToken: accessToken
                });
                await this.client.send(command).catch(e => console.warn("Global signout failed, clearing local only", e));
            }
        } finally {
            this.clearSession();
            runInAction(() => {
                this.isLoading = false;
            });
            // Optional: Redirect to Cognito logout endpoint if we want to clear SSO session too
            window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
        }
    }

    async checkAuth() {
        this.isLoading = true;

        try {
            // 1. Check for Authorization Code in URL (OAuth2 Callback)
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            // If state indicates calendar settings, ignore this code (handled by CalendarSettings)
            let skipExchange = false;
            if (code && state === 'settings_calendar') {
                skipExchange = true;
            }

            if (code && !skipExchange) {
                // Clear the code from URL logic handled after exchange or here
                // process the code
                await this.exchangeCodeForTokens(code);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            // 2. Check Local Storage
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");

            if (!accessToken && !refreshToken) {
                this.clearSession();
                return;
            }

            if (accessToken) {
                try {
                    await this.fetchUserAttributes(accessToken);
                    return; // Active and valid
                } catch (err) {
                    // Token likely expired
                    // console.log("Access token expired or invalid, trying refresh...");
                }
            }

            if (refreshToken) {
                await this.refreshSession(refreshToken);
            } else {
                this.clearSession();
            }

        } catch (err) {
            console.error("Auth check failed", err);
            this.clearSession();
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async exchangeCodeForTokens(code: string) {
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('client_id', CLIENT_ID);
            params.append('code', code);
            params.append('redirect_uri', REDIRECT_URI);

            const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${errorText}`);
            }

            const data = await response.json();

            // Map the snake_case response to CamelCase expected by handleAuthSuccess
            const authResult = {
                AccessToken: data.access_token,
                RefreshToken: data.refresh_token,
                IdToken: data.id_token,
                ExpiresIn: data.expires_in || 3600 // Default to 1h if missing
            };

            if (!authResult.RefreshToken) {
                console.warn("No Refresh Token returned from OAuth2 exchange. Session will not auto-refresh.");
            }

            this.handleAuthSuccess(authResult);
            if (authResult.AccessToken) {
                await this.fetchUserAttributes(authResult.AccessToken);
            }

        } catch (error) {
            console.error("Failed to exchange code", error);
            throw error;
        }
    }

    async refreshSession(refreshToken: string) {
        try {
            const command = new InitiateAuthCommand({
                AuthFlow: "REFRESH_TOKEN_AUTH",
                ClientId: CLIENT_ID,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            });

            const response = await this.client.send(command);
            if (response.AuthenticationResult) {
                this.handleAuthSuccess(response.AuthenticationResult);
                // Also fetch attributes to ensure user data is up to date? 
                // Usually not strictly needed for just token refresh, but good practice.
            } else {
                throw new Error("Refresh failed");
            }
        } catch (err) {
            console.error("Failed to refresh session", err);
            this.clearSession();
            throw err;
        }
    }

    // --- Helpers ---

    private refreshTimer: any = null;

    private handleAuthSuccess(authResult: any) {
        runInAction(() => {
            this.isAuthenticated = true;
        });

        if (authResult.AccessToken) {
            localStorage.setItem("accessToken", authResult.AccessToken);
        }
        if (authResult.RefreshToken) {
            localStorage.setItem("refreshToken", authResult.RefreshToken);
        }
        if (authResult.IdToken) {
            localStorage.setItem("idToken", authResult.IdToken);
        }

        // Use provided ExpiresIn or default to 3600 (1 hour)
        const expiresIn = authResult.ExpiresIn || 3600;
        const expiresInMs = expiresIn * 1000;
        // Refresh 5 minutes before expiry
        const refreshTime = expiresInMs - (5 * 60 * 1000);

        if (this.refreshTimer) clearTimeout(this.refreshTimer);

        if (refreshTime > 0) {
            console.log(`[AuthStore] Scheduling refresh in ${refreshTime / 1000}s`);
            this.refreshTimer = setTimeout(() => {
                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    console.log("[AuthStore] Auto-refreshing session...");
                    this.refreshSession(refreshToken);
                } else {
                    console.warn("[AuthStore] Cannot refresh, no refresh token.");
                }
            }, refreshTime);
        }
    }

    private clearSession() {
        runInAction(() => {
            this.isAuthenticated = false;
            this.user = null;
        });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("idToken");
    }

    private async fetchUserAttributes(accessToken: string) {
        try {
            // Try fetching from OIDC UserInfo endpoint first (Works with 'openid profile email' scopes)
            const response = await fetch(`${COGNITO_DOMAIN}/oauth2/userInfo`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const attributes = await response.json();
                runInAction(() => {
                    this.isAuthenticated = true;
                    // OIDC UserInfo returns 'sub' instead of 'username' usually, but can vary.
                    this.user = {
                        username: attributes.username || attributes.sub,
                        ...attributes
                    };

                    this.syncSettings(attributes);

                    // Always sync user to get latest Plan/Subscription status from DB
                    this.syncUser(this.pendingOnboardingData || null).then(() => {
                        if (this.pendingOnboardingData) {
                            this.clearPendingOnboarding();
                        }
                    });
                });
                return;
            } else {
                console.warn("UserInfo endpoint failed, falling back to GetUserCommand", response.status);
            }
        } catch (e) {
            console.warn("UserInfo fetch error", e);
        }

        // Fallback to Standard Auth flow using SDK (if UserInfo failed or not applicable)
        try {
            const command = new GetUserCommand({
                AccessToken: accessToken
            });
            const response = await this.client.send(command);

            runInAction(() => {
                this.isAuthenticated = true;
                const attributes = response.UserAttributes?.reduce((acc: any, attr) => {
                    if (attr.Name) acc[attr.Name] = attr.Value;
                    return acc;
                }, {}) || {};

                this.user = {
                    username: response.Username,
                    ...attributes
                };

                this.syncSettings(attributes);

                // Always sync user to get latest Plan/Subscription status from DB
                // If we have pending onboarding data, pass it.
                this.syncUser(this.pendingOnboardingData || null).then(() => {
                    if (this.pendingOnboardingData) {
                        this.clearPendingOnboarding();
                    }
                });
            });
        } catch (err) {
            console.error("Failed to fetch user attributes", err);
            throw err;
        }
    }

    private syncSettings(attributes: any) {
        if (this.rootStore.uiStore.settings.account) {
            if (attributes.name) {
                this.rootStore.uiStore.settings.account.setDisplayName(attributes.name);
            }
            if (attributes.email) {
                this.rootStore.uiStore.settings.account.email = attributes.email;
            }
            // Sync Team ID
            if (attributes['custom:teamId'] || attributes.teamId) {
                // Assuming we store it in SettingsStore or user object directly
                this.user.teamId = attributes['custom:teamId'] || attributes.teamId;
            }
        }
    }

    loginWithGoogle() {
        const url = `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&client_id=${CLIENT_ID}&scope=email+openid+profile`;
        window.location.href = url;
    }

    async syncUser(onboardingData: any) {
        try {
            const token = localStorage.getItem('accessToken');
            // @ts-ignore
            const apiUrl = import.meta.env.VITE_API_BASE_URL;

            // @ts-ignore
            const response = await fetch(`${apiUrl}/users/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ onboarding: onboardingData })
            });

            if (!response.ok) {
                console.warn("Failed to sync user data with backend");
            } else {
                const data = await response.json();
                runInAction(() => {
                    // Update local user with synced data if needed
                    if (data.data) {
                        this.user = { ...this.user, ...data.data };
                    }
                });
            }
        } catch (err) {
            console.error("Sync user error", err);
        }
    }

    setPendingOnboarding(data: any) {
        runInAction(() => {
            this.pendingOnboardingData = data;
        });
        localStorage.setItem('pendingOnboarding', JSON.stringify(data));
    }

    clearPendingOnboarding() {
        runInAction(() => {
            this.pendingOnboardingData = null;
        });
        localStorage.removeItem('pendingOnboarding');
    }
}
