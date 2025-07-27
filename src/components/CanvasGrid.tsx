import React, { useRef, useEffect, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Constants
const MIN_TILE_SIZE = 10
const MAX_TILE_SIZE = 100
const MAX_GRID_WIDTH = 50
const MAX_GRID_HEIGHT = 50
const MAX_CANVAS_SIZE = 2000
const MIN_PPI = 40
const MAX_PPI = 140
const DEFAULT_PPI = 80

const BIOMES = [
  { name: 'Arctic', color: '#E3F2FD' },
  { name: 'Bog', color: '#4A5D23' },
  { name: 'Desert', color: '#F4A460' },
  { name: 'Forest', color: '#228B22' },
  { name: 'Hills', color: '#8FBC8F' },
  { name: 'Jungle', color: '#006400' },
  { name: 'Mountains', color: '#696969' },
  { name: 'Plains', color: '#9ACD32' },
  { name: 'Road', color: '#708090' },
  { name: 'Woodland', color: '#32CD32' },
] as const

type GridType =
  | 'square'
  | 'hex-flat-odd'
  | 'hex-flat-even'
  | 'hex-pointy-odd'
  | 'hex-pointy-even'

interface GridDimensions {
  rawWidth: number
  rawHeight: number
  scale: number
  canvasWidth: number
  canvasHeight: number
}

const HexagonFlat = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="6,2 18,2 22,12 18,22 6,22 2,12" />
  </svg>
)

const HexagonPointy = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
  </svg>
)

const calculateGridDimensions = (
  gridType: GridType,
  cols: number,
  rows: number,
  tileSize: number,
  borderWidth: number
): GridDimensions => {
  const r = tileSize / 2
  let rawWidth = 0
  let rawHeight = 0
  const d = 2 * r
  const s = Math.sqrt(3) * r
  const R = s / 2 
  const a = r
  const tSquared = Math.pow(a, 2) - Math.pow(s / 2, 2) // a² = c² - b² where a = t
  const t = Math.sqrt(tSquared)

  switch (gridType) {
    case 'square':
      rawWidth = cols * tileSize + borderWidth * 2
      rawHeight = rows * tileSize + borderWidth * 2
      break

    case 'hex-flat-odd':
    case 'hex-flat-even': {
      rawWidth = borderWidth * 2 + (d - t) * cols - t + d / 2
      rawHeight = borderWidth * 2 + s * rows + s / 2
      break
    }

    case 'hex-pointy-odd':
    case 'hex-pointy-even': {
      rawWidth = borderWidth * 2 + s * cols + s / 2
      rawHeight = borderWidth * 2 + (d - t) * rows - t + d / 2
      break
    }
  }

  const scale = Math.min(
    1,
    MAX_CANVAS_SIZE / Math.max(rawWidth, rawHeight)
  )

  return {
    rawWidth,
    rawHeight,
    scale,
    canvasWidth: Math.round(rawWidth * scale),
    canvasHeight: Math.round(rawHeight * scale),
  }
}

const drawHexagon = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  flat: boolean,
  fillColor?: string,
  borderWidth = 1,
  borderColor = '#000'
) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6)
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    // i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    if (i === 0) {
     ctx.moveTo(x, y)
   } else {
     ctx.lineTo(x, y)
   }
  }
  ctx.closePath()
  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
  if (borderWidth > 0) {
    ctx.lineWidth = borderWidth
    ctx.strokeStyle = borderColor
    ctx.stroke()
  }
}

const drawSquareGrid = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  tileSize: number,
  biomeGrid: string[][],
  borderWidth: number,
  borderColor: string
) => {
  const xoffset = borderWidth
  const yoffset = borderWidth

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize + xoffset
      const y = r * tileSize + yoffset
      const color = biomeGrid[r]?.[c]
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(x, y, tileSize, tileSize)
      }
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth
        ctx.strokeRect(x, y, tileSize, tileSize)
      }
    }
  }
}

const drawHexGrid = (
  ctx: CanvasRenderingContext2D,
  gridType: GridType,
  cols: number,
  rows: number,
  tileSize: number,
  biomeGrid: string[][],
  borderWidth: number,
  borderColor: string
) => {
  const flat = gridType.startsWith('hex-flat')
  const odd = gridType.endsWith('odd')
  const r = tileSize / 2
  const hexW = flat ? 2 * r : Math.sqrt(3) * r
  const hexH = flat ? Math.sqrt(3) * r : 2 * r
  const colSp = flat ? (3 / 2) * r : hexW
  const rowSp = flat ? hexH : (3 / 2) * r

  const xOff = borderWidth + (flat ? r : hexW / 2)
  const yOff = borderWidth + (flat ? hexH / 2 : r)
  // const xOff = borderWidth + (flat ? hexH / 3 + 3 : hexH / 3 - 1)
  // const yOff = borderWidth + (flat ? hexH / 3: hexH / 3 + 1)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let cx = xOff + col * colSp
      let cy = yOff + row * rowSp
      if (flat) {
        if (col % 2 === (odd ? 1 : 0)) cy += hexH / 2
      } else {
        if (row % 2 === (odd ? 1 : 0)) cx += hexW / 2
      }
      drawHexagon(
        ctx,
        cx,
        cy,
        r,
        flat,
        biomeGrid[row]?.[col],
        borderWidth,
        borderColor
      )
    }
  }
}

const gridTypeOptions = [
  {
    value: 'square',
    icon: Square,
    label: 'Square Grid',
    description: 'Standard rectangular grid',
  },
  {
    value: 'hex-flat-odd',
    icon: HexagonFlat,
    label: 'Flat-Top Hex (Odd Right)',
    description: 'Hexagons with flat tops, odd rows shifted right',
  },
  {
    value: 'hex-flat-even',
    icon: HexagonFlat,
    label: 'Flat-Top Hex (Even Right)',
    description: 'Hexagons with flat tops, even rows shifted right',
  },
  {
    value: 'hex-pointy-odd',
    icon: HexagonPointy,
    label: 'Pointy-Top Hex (Odd Down)',
    description: 'Hexagons with pointy tops, odd columns shifted down',
  },
  {
    value: 'hex-pointy-even',
    icon: HexagonPointy,
    label: 'Pointy-Top Hex (Even Down)',
    description: 'Hexagons with pointy tops, even columns shifted down',
  },
] as const

const CanvasGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gridType, setGridType] = useState<GridType>('square')
  const [cols, setCols] = useState(20)
  const [rows, setRows] = useState(20)
  const [tileSize, setTileSize] = useState(30)
  const [ppi, setPpi] = useState(DEFAULT_PPI)
  const [borderWidth, setBorderWidth] = useState(1)
  const [borderColor, setBorderColor] = useState('#000000')
  const [biomeGrid, setBiomeGrid] = useState<string[][]>([])

  const tileSizeInches = tileSize / ppi

  const generateBiomeGrid = () => {
    const grid: string[][] = []
    for (let r = 0; r < rows; r++) {
      grid[r] = []
      for (let c = 0; c < cols; c++) {
        const color = BIOMES[
          Math.floor(Math.random() * BIOMES.length)
        ].color
        grid[r][c] = color
      }
    }
    setBiomeGrid(grid)
  }

  useEffect(generateBiomeGrid, [cols, rows])

  const drawGrid = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const {
      canvasWidth,
      canvasHeight,
      scale,
    } = calculateGridDimensions(
      gridType,
      cols,
      rows,
      tileSize,
      borderWidth
    )

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    if (scale < 1) {
      ctx.save()
      ctx.scale(scale, scale)
    }

    if (gridType === 'square') {
      drawSquareGrid(
        ctx,
        cols,
        rows,
        tileSize,
        biomeGrid,
        borderWidth,
        borderColor
      )
    } else {
      drawHexGrid(
        ctx,
        gridType,
        cols,
        rows,
        tileSize,
        biomeGrid,
        borderWidth,
        borderColor
      )
    }

    if (scale < 1) ctx.restore()
  }

  useEffect(drawGrid, [
    gridType,
    cols,
    rows,
    tileSize,
    borderWidth,
    borderColor,
    biomeGrid,
  ])

  return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Canvas Grid</h2>
            <Button onClick={generateBiomeGrid} variant="outline">
              Regenerate Biomes
            </Button>
          </div>

          {/* Grid Type Selection */}
         <div>
  <Label className="mb-2 text-base font-medium">Grid Type</Label>
  <RadioGroup
    value={gridType}
    onValueChange={(v) => setGridType(v as GridType)}
    className="grid grid-cols-5 gap-4"
  >
    {gridTypeOptions.map((option) => {
      const id = `grid-type-${option.value}`
      return (
        <div
          key={option.value}
          className="flex items-center space-x-2"
        >
          <RadioGroupItem value={option.value} id={id} />
          <Label htmlFor={id} className="flex items-center space-x-1">
            <option.icon className="w-6 h-6" />
            <span className="text-xs">
              {option.label}
            </span>
          </Label>
        </div>
      )
    })}
  </RadioGroup>
</div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Width: {cols} tiles
              </Label>
              <Slider
                value={[cols]}
                onValueChange={(v) => setCols(v[0])}
                min={1}
                max={MAX_GRID_WIDTH}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Height: {rows} tiles
              </Label>
              <Slider
                value={[rows]}
                onValueChange={(v) => setRows(v[0])}
                min={1}
                max={MAX_GRID_HEIGHT}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          {/* Tile Size & PPI */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Tile Size: {tileSize}px ({tileSizeInches.toFixed(2)}")
              </Label>
              <Slider
                value={[tileSize]}
                onValueChange={(v) => setTileSize(v[0])}
                min={MIN_TILE_SIZE}
                max={MAX_TILE_SIZE}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">PPI: {ppi}</Label>
              <Slider
                value={[ppi]}
                onValueChange={(v) => setPpi(v[0])}
                min={MIN_PPI}
                max={MAX_PPI}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          {/* Border Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Border Width: {borderWidth}px
              </Label>
              <Slider
                value={[borderWidth]}
                onValueChange={(v) => setBorderWidth(v[0])}
                min={0}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Border Color</Label>
              <Input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-full h-10 mt-2"
              />
            </div>
          </div>

          {/* Biome Legend */}
          <div>
            <Label className="text-sm font-medium">Biomes</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {BIOMES.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 border border-gray-300 rounded"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="text-xs">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className='border border-gray-300 rounded shadow-sm'
          />
        </div>
      </div>
  )
}

export default CanvasGrid