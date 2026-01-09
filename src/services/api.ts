import { store } from "../models/store";
import { Task, Group } from "../models/core";

/**
 * API Facade
 * This class abstracts all backend interactions.
 * Currently getting data from local Store, but ready for HTTP calls.
 */
class ApiService {
    // --- Auth ---
    async getCurrentUser() {
        // Return mock user
        return Promise.resolve(store.currentUser);
    }

    async updateProfile(updates: any) {
        console.log("Mock API: Updating profile", updates);
        return Promise.resolve({ ...store.currentUser, ...updates });
    }

    // --- Groups ---
    async getGroups() {
        return Promise.resolve(store.groups);
    }

    async createGroup(name: string) {
        console.log("Mock API: Creating group", name);
        // In real app, we'd wait for server ID
        return Promise.resolve(store.createGroup(name));
    }

    // --- Tasks ---
    async getTasks(groupId?: string) {
        if (groupId) {
            const group = store.groups.find(g => g.id === groupId);
            return Promise.resolve(group ? group.tasks : []);
        }
        return Promise.resolve(store.dumpAreaTasks);
    }

    async createTask(title: string, groupId?: string) {
        console.log(`Mock API: Creating task '${title}' in ${groupId || 'Dump'}`);
        // Logic handled in store for now, but API would POST here
        if (groupId) {
            // ...
        } else {
            store.addTaskToDump(title);
        }
        return Promise.resolve();
    }

    async updateTask(taskId: string, updates: Partial<Task>) {
        console.log("Mock API: Updating Task", taskId, updates);
        return Promise.resolve();
    }

    // --- Team ---
    async inviteUser(email: string) {
        console.log("Mock API: Inviting user", email);
        return Promise.resolve({ success: true });
    }
}

export const api = new ApiService();
