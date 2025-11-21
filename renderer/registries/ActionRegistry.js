
class ActionRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    if (!plugin.type || !plugin.Editor) {
      console.error("Invalid plugin registration:", plugin);
      return;
    }
    this.plugins.set(plugin.type, plugin);
  }

  get(type) {
    return this.plugins.get(type);
  }

  getAll() {
    return Array.from(this.plugins.values());
  }
}

export const actionRegistry = new ActionRegistry();
