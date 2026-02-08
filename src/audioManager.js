export const audioManager = {
  enabled: JSON.parse(localStorage.getItem("soundEnabled") ?? "true"),

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("soundEnabled", this.enabled);
  }
};