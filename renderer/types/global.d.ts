export {};

declare global {
  interface Window {
    api: {
      settings: {
        read: () => Promise<any>;
        write: (settings: any) => Promise<void>;
      };
      [key: string]: any;
    };
  }
}
