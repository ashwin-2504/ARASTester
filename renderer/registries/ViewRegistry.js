
class ViewRegistry {
  constructor() {
    this.views = new Map();
    this.defaultView = null;
  }

  register(view) {
    if (!view.id || !view.Component) {
      console.error("Invalid view registration:", view);
      return;
    }
    this.views.set(view.id, view);
    if (view.isDefault) {
      this.defaultView = view.id;
    }
  }

  get(id) {
    return this.views.get(id);
  }

  getDefault() {
    return this.defaultView;
  }
}

export const viewRegistry = new ViewRegistry();
