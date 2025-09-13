export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    created_at: string;
                    email: string;
                    name: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    email: string;
                    name?: string | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    email?: string;
                    name?: string | null;
                };
            };
            settings: {
                Row: {
                    id: string;
                    user_id: string;
                    theme: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    theme?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    theme?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// Type-safe database types
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Helper types for each table
export type User = Tables['users']['Row'];
export type NewUser = Tables['users']['Insert'];
export type UserUpdate = Tables['users']['Update'];

export type Settings = Tables['settings']['Row'];
export type NewSettings = Tables['settings']['Insert'];
export type SettingsUpdate = Tables['settings']['Update'];
