import { makeAutoObservable } from "mobx";

export class AccountSettingsModel {
    // Profile
    displayName: string = 'Tuci';
    email: string = 'adrian.tucicovenco@gmail.com';
    avatarUrl: string = '';

    // Change Email State
    changeEmail = {
        newEmail: '',
        confirmPassword: ''
    };

    // Change Password State
    changePassword = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    };

    constructor() {
        makeAutoObservable(this);
    }

    setDisplayName(name: string) {
        this.displayName = name;
    }

    setChangeEmailField(field: keyof typeof this.changeEmail, value: string) {
        this.changeEmail[field] = value;
    }

    setChangePasswordField(field: keyof typeof this.changePassword, value: string) {
        this.changePassword[field] = value;
    }

    saveProfile() {
        // Mock save
        console.log('Saving profile:', this.displayName, this.avatarUrl);
    }

    updateEmail() {
        // Mock update
        console.log('Updating email to:', this.changeEmail.newEmail);
        // Reset fields after successful update
        this.changeEmail.newEmail = '';
        this.changeEmail.confirmPassword = '';
    }

    updatePassword() {
        // Mock update
        console.log('Updating password');
        // Reset fields
        this.changePassword.currentPassword = '';
        this.changePassword.newPassword = '';
        this.changePassword.confirmNewPassword = '';
    }
}
