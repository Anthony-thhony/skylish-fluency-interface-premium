/**
 * Adaptador de armazenamento para navegador.
 * Substitui o window.storage usado no protótipo original por localStorage.
 */
(function createBrowserStorage() {
  if (window.storage) return;

  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    },

    async set(key, value) {
      localStorage.setItem(key, String(value));
      return { value: String(value) };
    },

    async delete(key) {
      localStorage.removeItem(key);
      return { deleted: true };
    }
  };
})();
