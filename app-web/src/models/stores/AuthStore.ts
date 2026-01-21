
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
const COGNITO_DOMAIN = "https://auth.simplu.io"; // Custom Domain
const CLIENT_ID = "ar2m2qg3gp4a0b4cld09aegdb";
const REDIRECT_URI = "http://localhost:5173";
const REGION = "eu-central-1";

// We can keep using env vars as fallbacks or overrides if needed, but per request using provided values
const AWS_REGION = import.meta.env.VITE_AWS_REGION || REGION;

export class AuthStore {
    rootStore: ProjectStore;
    client: CognitoIdentityProviderClient;

    user: any = null;
    isAuthenticated: boolean = false;
    isLoading: boolean = true;
    error: string | null = null;

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
            const command = new SignUpCommand({
                ClientId: CLIENT_ID,
                Username: email,
                Password: password,
                UserAttributes: [
                    { Name: "email", Value: email },
                    { Name: "name", Value: name }
                ],
            });

            await this.client.send(command);
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

    async confirmRegistration(email: string, code: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const command = new ConfirmSignUpCommand({
                ClientId: CLIENT_ID,
                Username: email,
                ConfirmationCode: code,
            });

            await this.client.send(command);
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to confirm registration";
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

            if (code) {
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
                    console.log("Access token expired or invalid, trying refresh...");
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
                ExpiresIn: data.expires_in
            };

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
                await this.fetchUserAttributes(response.AuthenticationResult.AccessToken!);
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

        if (authResult.ExpiresIn) {
            const expiresInMs = authResult.ExpiresIn * 1000;
            const refreshTime = expiresInMs - (5 * 60 * 1000);

            if (this.refreshTimer) clearTimeout(this.refreshTimer);

            if (refreshTime > 0) {
                this.refreshTimer = setTimeout(() => {
                    const refreshToken = localStorage.getItem("refreshToken");
                    if (refreshToken) {
                        this.refreshSession(refreshToken);
                    }
                }, refreshTime);
            }
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
        const url = `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&client_id=${CLIENT_ID}&scope=email+openid+phone+profile`;
        window.location.href = url;
    }
}
