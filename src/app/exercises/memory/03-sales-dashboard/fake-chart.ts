/** Stand-in for a third-party charting library: imperative, owns listeners and an animation loop. */
export class FakeChart {
  static live = 0;

  private host?: HTMLElement;
  private data: number[] = [];
  private frame = 0;
  private readonly onResize = () => this.draw();

  init(host: HTMLElement) {
    FakeChart.live++;
    this.host = host;
    window.addEventListener('resize', this.onResize);
    const loop = () => {
      this.draw();
      this.frame = requestAnimationFrame(loop);
    };
    loop();
  }

  update(data: number[]) {
    this.data = data;
    this.draw();
  }

  destroy() {
    FakeChart.live--;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    this.host = undefined;
  }

  private draw() {
    if (this.host) {
      this.host.dataset['points'] = String(this.data.length);
    }
  }
}
