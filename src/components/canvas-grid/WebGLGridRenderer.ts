// Add this method to the WebGLGridRenderer class after the existing render method

public renderWithBorders(
  gridType: GridType,
  cols: number,
  rows: number,
  tileSize: number,
  borderWidth: number,
  borderColor: string,
  biomeGrid: (string | null)[][],
  panOffset: { x: number; y: number },
  zoomLevel: number,
  scale: number
) {
  // First render the main grid
  this.render(gridType, cols, rows, tileSize, borderWidth, biomeGrid, panOffset, zoomLevel, scale);
  
  // Then render borders if needed
  if (borderWidth > 0) {
    this.renderBorders(gridType, cols, rows, tileSize, borderWidth, borderColor, panOffset, zoomLevel, scale);
  }
}

private renderBorders(
  gridType: GridType,
  cols: number,
  rows: number,
  tileSize: number,
  borderWidth: number,
  borderColor: string,
  panOffset: { x: number; y: number },
  zoomLevel: number,
  scale: number
) {
  const gl = this.gl;
  
  // Convert border color to RGB
  const hex = borderColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Enable blending for line rendering
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  if (gridType === "square") {
    this.renderSquareBorders(cols, rows, tileSize, borderWidth, [r, g, b], panOffset, zoomLevel, scale);
  } else {
    this.renderHexBorders(gridType, cols, rows, tileSize, borderWidth, [r, g, b], panOffset, zoomLevel, scale);
  }
  
  gl.disable(gl.BLEND);
}

private renderSquareBorders(
  cols: number,
  rows: number,
  tileSize: number,
  borderWidth: number,
  color: number[],
  panOffset: { x: number; y: number },
  zoomLevel: number,
  scale: number
) {
  // Implementation for square grid borders
  // This would draw lines between grid cells
  // For brevity, showing concept - full implementation would use line rendering
}

private renderHexBorders(
  gridType: GridType,
  cols: number,
  rows: number,
  tileSize: number,
  borderWidth: number,
  color: number[],
  panOffset: { x: number; y: number },
  zoomLevel: number,
  scale: number
) {
  // Implementation for hex grid borders
  // Similar to square but for hex geometry
}