export const queryKeys = {
  app: ["app"] as const,
  session: ["session"] as const,
  studio: {
    all: ["studio"] as const,
    scenarios: () => [...queryKeys.studio.all, "scenarios"] as const,
    scenario: (id: string) => [...queryKeys.studio.scenarios(), id] as const,
  },
};
