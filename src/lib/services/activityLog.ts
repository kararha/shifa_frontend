import { api } from '$lib/api/client';

export interface ActivityLogEntry {
    userId: number;
    action: string;
    details: string;
    timestamp: Date;
}

export class ActivityLogger {
    static async logUserAction(
        action: string, 
        userId: number, 
        details: string
    ): Promise<void> {
        try {
            await api.post('/logs', {
                userId,
                action,
                details,
                timestamp: new Date().toISOString()
            });
            console.log(`Activity logged: ${action}`);
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Don't throw - logging should not interrupt main flow
        }
    }

    static async getActivityLogs(): Promise<ActivityLogEntry[]> {
        try {
            const response = await api.get<ActivityLogEntry[]>('/logs');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            return [];
        }
    }
}
