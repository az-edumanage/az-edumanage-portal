export interface AppRuntimeConfig {
  appName: string;
  defaultTheme: 'light' | 'dark';
}

export const appRuntimeConfig: AppRuntimeConfig = {
  appName: 'Education Manager',
  defaultTheme: 'dark',
};
