declare module '*.json' {
  const value: {
    app: {
      name: string;
      version: string;
    };
    music: {
      baseUrl: string;
    };
  };
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}