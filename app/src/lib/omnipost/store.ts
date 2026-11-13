/**
 * Minimal observable state container backing the OmniPost view model.
 * Mirrors the `state` / `setState` contract the design prototype was written against,
 * so the ported logic stays close to the approved design behaviour.
 */
export type Updater<S> = Partial<S> | ((prev: S) => Partial<S>);

export abstract class Store<S extends Record<string, unknown>> {
  abstract state: S;
  private listeners = new Set<() => void>();
  private version = 0;

  /** Called when a state patch asks for a route change; wired to the Next.js router. */
  navigate: (route: string) => void = () => {};

  setState(patch: Updater<S>): void {
    const next = typeof patch === "function" ? patch(this.state) : patch;
    const { route, ...rest } = next as Partial<S> & { route?: string };
    this.state = { ...this.state, ...rest };
    this.version++;
    this.listeners.forEach((l) => l());
    if (typeof route === "string" && route !== this.state.route) this.navigate(route);
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;
}
