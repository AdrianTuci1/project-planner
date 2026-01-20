
import { makeAutoObservable, runInAction } from "mobx";
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    GlobalSignOutCommand,
    GetUserCommand,
    AuthFlowType
} from "@aws-sdk/client-cognito-identity-provider";
import { ProjectStore } from "../store";

// Configuration from env environment variables
const REGION = import.meta.env.VITE_AWS_REGION || "us-east-1";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";
// User Pool ID is not strictly needed for client-side Auth unless we are doing admin operations, 
// usually Client ID is enough for InitiateAuth/SignUp, but keeping it if needed for other ops.

export class AuthStore {
    rootStore: ProjectStore;
    client: CognitoIdentityProviderClient;

    user: any = null;
    isAuthenticated: boolean = false;
    isLoading: boolean = true;
    error: string | null = null;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        this.client = new CognitoIdentityProviderClient({ region: REGION });
        makeAutoObservable(this);

        // Check for existing session on load
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
                // Challenge flow might be needed (e.g. NEW_PASSWORD_REQUIRED)
                // For now, assuming standard flow.
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
            // Registration successful. Usually requires confirmation next.
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
                // Optional: GlobalSignOut invalidates all tokens for the user
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
        }
    }

    async checkAuth() {
        this.isLoading = true;

        try {
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");

            if (!accessToken && !refreshToken) {
                this.clearSession();
                return;
            }

            // If we have an access token, try to verify it by getting user details
            if (accessToken) {
                try {
                    await this.fetchUserAttributes(accessToken);
                    return; // Active and valid
                } catch (err) {
                    // Token likely expired, try refresh
                    console.log("Access token expired or invalid, trying refresh...");
                }
            }

            // Try to refresh if access token failed or was missing, but we have refresh token
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
                // REFRESH_TOKEN_AUTH usually returns IDToken and AccessToken, maybe new RefreshToken
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
            // Keep existing refresh token if not returned new
            localStorage.setItem("refreshToken", authResult.RefreshToken);
        }
        if (authResult.IdToken) {
            localStorage.setItem("idToken", authResult.IdToken);
        }

        // Setup automatic refresh
        if (authResult.ExpiresIn) {
            const expiresInMs = authResult.ExpiresIn * 1000;
            // Refresh 5 minutes before expiry
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
        const command = new GetUserCommand({
            AccessToken: accessToken
        });
        const response = await this.client.send(command);

        runInAction(() => {
            this.isAuthenticated = true;
            // Transform attributes array to object
            const attributes = response.UserAttributes?.reduce((acc: any, attr) => {
                if (attr.Name) acc[attr.Name] = attr.Value;
                return acc;
            }, {}) || {};

            this.user = {
                username: response.Username,
                ...attributes
            };

            // Sync with AccountSettingsModel
            if (this.rootStore.uiStore.settings.account) {
                if (attributes.name) {
                    this.rootStore.uiStore.settings.account.setDisplayName(attributes.name);
                }
                if (attributes.email) {
                    // Assuming we might want to sync email too, though AccountSettingsModel has it hardcoded currently in the class definition.
                    this.rootStore.uiStore.settings.account.email = attributes.email;
                }
            }
        });
    }
    async loginWithGoogle() {
        // AWS Cognito Federation for Google:
        // We must redirect the user to the Cognito Hosted UI or a custom domain endpoint.
        // Cognito handles the logic with Google and redirects back with a code.

        // Example URL construction:
        // const domain = `https://${import.meta.env.VITE_COGNITO_DOMAIN}`;
        // const redirectUri = window.location.origin; // Or specific callback route
        // const clientId = CLIENT_ID;
        // const url = `${domain}/oauth2/authorize?identity_provider=Google&redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=email+openid+profile`;

        // window.location.href = url;

        console.log("Initiating Google Login via AWS Cognito...");
        alert("Google Login requires the Cognito Domain configured. It will redirect to Cognito, which validates with Google, and returns to the app.");
    }
}
