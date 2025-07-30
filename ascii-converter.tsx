"use client"

import type React from "react"

import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { GripVertical, Upload, Download } from "lucide-react"

// Define a type for colored ASCII characters
type ColoredChar = {
  char: string
  color: string
}

export default function AsciiConverter() {
  // State variables
  const [darkMode, setDarkMode] = useState(true)
  const [width, setWidth] = useState(200)
  const [dither, setDither] = useState(false)
  const [colorCalc, setColorCalc] = useState("RGBsum")
  const [noEmpty, setNoEmpty] = useState(false)
  const [colorOutput, setColorOutput] = useState("none")
  const [autoContrast, setAutoContrast] = useState(false)
  const [blankMode, setBlankMode] = useState(false)
  const [conversionMode, setConversionMode] = useState("ascii") // "ascii" or "braille"
  const [resolution, setResolution] = useState(0.11)
  const [inverted, setInverted] = useState(false)
  const [grayscale, setGrayscale] = useState(true)
  const [charSet, setCharSet] = useState("standard")
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [asciiArt, setAsciiArt] = useState<string>("")
  const [coloredAsciiArt, setColoredAsciiArt] = useState<ColoredChar[][]>([])
  const [leftPanelWidth, setLeftPanelWidth] = useState(25)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [sidebarNarrow, setSidebarNarrow] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const outputDivRef = useRef<HTMLDivElement>(null)

  const charSets = {
    standard: " .:-=+*#%@",
    detailed: " .,:;i1tfLCG08@",
    blocks: " ░▒▓█",
    minimal: " .:█",
  }

  // Set document background based on mode
  useEffect(() => {
    if (typeof document !== "undefined") {
      const bgColor = darkMode ? "black" : "white"
      const textColor = darkMode ? "white" : "black"
      document.documentElement.style.backgroundColor = bgColor
      document.body.style.backgroundColor = bgColor
      document.documentElement.style.color = textColor
    }

    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.backgroundColor = ""
        document.body.style.backgroundColor = ""
        document.documentElement.style.color = ""
      }
    }
  }, [darkMode])

  // Set hydration state
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    setIsDesktop(window.innerWidth >= 768)

    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 768
      setIsDesktop(newIsDesktop)

      if (newIsDesktop !== isDesktop) {
        setLeftPanelWidth(25)
      }
    }

    window.addEventListener("resize", handleResize)
    loadDefaultImage()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isDesktop, isHydrated])

  // Check if sidebar is narrow
  useEffect(() => {
    if (!isHydrated || !isDesktop) return

    const checkSidebarWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const sidebarWidth = (leftPanelWidth / 100) * containerWidth
        setSidebarNarrow(sidebarWidth < 350)
      }
    }

    checkSidebarWidth()
    window.addEventListener("resize", checkSidebarWidth)

    return () => {
      window.removeEventListener("resize", checkSidebarWidth)
    }
  }, [leftPanelWidth, isHydrated, isDesktop])

  // Convert to ASCII when settings change
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      convertToAscii()
    }
  }, [
    resolution,
    inverted,
    grayscale,
    charSet,
    imageLoaded,
    conversionMode,
    width,
    dither,
    colorCalc,
    noEmpty,
    blankMode,
    autoContrast,
  ])

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

        if (newLeftWidth >= 20 && newLeftWidth <= 80) {
          setLeftPanelWidth(newLeftWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const startDragging = () => {
    setIsDragging(true)
  }

  const loadDefaultImage = () => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions")
        setLoading(false)
        return
      }

      imageRef.current = img
      setImageLoaded(true)
      setLoading(false)
    }

    img.onerror = () => {
      setError("Failed to load image")
      setLoading(false)
    }

    img.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CleanShot%202025-04-21%20at%2007.18.50%402x-dZYTCjkP7AhQCvCtNcNHt4amOQSwtX.png"
  }

  const loadImage = (src: string) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions")
        setLoading(false)
        return
      }

      imageRef.current = img
      setImageLoaded(true)
      setLoading(false)
    }

    img.onerror = () => {
      setError("Failed to load image")
      setLoading(false)
    }

    img.src = src
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        loadImage(e.target.result as string)
      }
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }

  const handleDragLeave = () => {
    setIsDraggingFile(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const calculateBrightness = (r: number, g: number, b: number, method: string): number => {
    switch (method) {
      case "R":
        return r / 255
      case "G":
        return g / 255
      case "B":
        return b / 255
      case "BW":
        return (r * 0.299 + g * 0.587 + b * 0.114) / 255
      case "RGBsum":
      default:
        return (r + g + b) / (3 * 255)
    }
  }

  const convertToBraille = (data: Uint8ClampedArray, width: number, height: number) => {
    let result = ""
    const coloredResult: ColoredChar[][] = []

    // Calculate average for threshold
    let average = 127.5
    if (autoContrast) {
      let sum = 0
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        sum += calculateBrightness(r, g, b, colorCalc) * 255
        count++
      }
      average = count > 0 ? sum / count : 127.5
    }

    for (let y = 0; y < height - 3; y += 4) {
      const coloredRow: ColoredChar[] = []

      for (let x = 0; x < width - 1; x += 2) {
        if (blankMode) {
          const char = String.fromCharCode(0x28ff)
          const pos = (y * width + x) * 4
          const r = data[pos] || 0
          const g = data[pos + 1] || 0
          const b = data[pos + 2] || 0
          const color = grayscale ? (darkMode ? "white" : "black") : `rgb(${r}, ${g}, ${b})`

          result += char
          coloredRow.push({ char, color })
          continue
        }

        let blockVal = 0x2800

        // Check each dot in the 2x4 Braille block
        const positions = [
          [0, 0, 0x0001],
          [1, 0, 0x0008],
          [0, 1, 0x0002],
          [1, 1, 0x0010],
          [0, 2, 0x0004],
          [1, 2, 0x0020],
          [0, 3, 0x0040],
          [1, 3, 0x0080],
        ]

        let avgR = 0,
          avgG = 0,
          avgB = 0,
          count = 0

        for (const [dx, dy, bit] of positions) {
          const px = x + dx
          const py = y + dy

          if (px < width && py < height) {
            const pos = (py * width + px) * 4
            const r = data[pos] || 0
            const g = data[pos + 1] || 0
            const b = data[pos + 2] || 0

            avgR += r
            avgG += g
            avgB += b
            count++

            const brightness = calculateBrightness(r, g, b, colorCalc) * 255
            const shouldFill = inverted ? brightness > average : brightness < average

            if (shouldFill) {
              blockVal += bit
            }
          }
        }

        // Handle empty blocks
        if (noEmpty && blockVal === 0x2800) {
          blockVal = 0x2801
        }

        const char = String.fromCharCode(blockVal)

        // Calculate average color for this block
        if (count > 0) {
          avgR = Math.floor(avgR / count)
          avgG = Math.floor(avgG / count)
          avgB = Math.floor(avgB / count)
        }

        let color: string
        if (grayscale) {
          color = darkMode ? "white" : "black"
        } else {
          // Ensure good contrast in light mode
          if (!darkMode) {
            avgR = Math.max(avgR, 50)
            avgG = Math.max(avgG, 50)
            avgB = Math.max(avgB, 50)
          }
          color = `rgb(${avgR}, ${avgG}, ${avgB})`
        }

        result += char
        coloredRow.push({ char, color })
      }

      result += "\n"
      coloredResult.push(coloredRow)
    }

    return { text: result, colored: coloredResult }
  }

  const convertToAscii = () => {
    try {
      if (!canvasRef.current || !imageRef.current) {
        throw new Error("Canvas or image not available")
      }

      const img = imageRef.current

      if (img.width === 0 || img.height === 0) {
        throw new Error("Invalid image dimensions")
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Calculate dimensions
      let targetWidth, targetHeight
      if (conversionMode === "braille") {
        targetWidth = width
        targetHeight = Math.round((width * img.height) / img.width)
        // Ensure dimensions are compatible with Braille blocks (2x4)
        targetWidth += targetWidth % 2
        targetHeight += targetHeight % 4
      } else {
        // For ASCII mode, use a larger base size for better visibility
        const baseWidth = Math.max(100, Math.floor(img.width * resolution * 200))
        const baseHeight = Math.max(50, Math.floor(img.height * resolution * 100))
        targetWidth = baseWidth
        targetHeight = baseHeight
      }

      canvas.width = targetWidth
      canvas.height = targetHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      let imageData
      try {
        imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      } catch (e) {
        throw new Error("Failed to get image data. This might be a CORS issue.")
      }

      const data = imageData.data

      if (conversionMode === "braille") {
        const result = convertToBraille(data, targetWidth, targetHeight)
        setAsciiArt(result.text)
        setColoredAsciiArt(result.colored)
      } else {
        // Regular ASCII character-based conversion
        const chars = charSets[charSet as keyof typeof charSets]
        const fontAspect = 0.5
        const widthStep = Math.max(1, Math.floor(targetWidth / (targetWidth * resolution)))
        const heightStep = Math.max(1, Math.floor(targetHeight / (targetHeight * resolution) / fontAspect))

        let result = ""
        const coloredResult: ColoredChar[][] = []

        for (let y = 0; y < targetHeight; y += heightStep) {
          const coloredRow: ColoredChar[] = []

          for (let x = 0; x < targetWidth; x += widthStep) {
            const pos = (y * targetWidth + x) * 4
            const r = data[pos]
            const g = data[pos + 1]
            const b = data[pos + 2]

            let brightness = calculateBrightness(r, g, b, colorCalc)

            if (autoContrast) {
              brightness = Math.pow(brightness, 1.2)
            }

            if (inverted) brightness = 1 - brightness

            const charIndex = Math.floor(brightness * (chars.length - 1))
            const char = chars[charIndex]

            result += char

            if (!grayscale) {
              const brightnessFactor = (charIndex / (chars.length - 1)) * 1.5 + 0.5
              let color: string
              if (darkMode) {
                const minBrightness = 40
                const adjR = Math.max(Math.min(Math.round(r * brightnessFactor), 255), minBrightness)
                const adjG = Math.max(Math.min(Math.round(g * brightnessFactor), 255), minBrightness)
                const adjB = Math.max(Math.min(Math.round(b * brightnessFactor), 255), minBrightness)
                color = `rgb(${adjR}, ${adjG}, ${adjB})`
              } else {
                const maxBrightness = 180
                const adjR = Math.min(Math.max(Math.round(r * brightnessFactor), 30), maxBrightness)
                const adjG = Math.min(Math.max(Math.round(g * brightnessFactor), 30), maxBrightness)
                const adjB = Math.min(Math.max(Math.round(b * brightnessFactor), 30), maxBrightness)
                color = `rgb(${adjR}, ${adjG}, ${adjB})`
              }
              coloredRow.push({ char, color })
            } else {
              coloredRow.push({ char, color: darkMode ? "white" : "black" })
            }
          }

          result += "\n"
          coloredResult.push(coloredRow)
        }

        setAsciiArt(result)
        setColoredAsciiArt(coloredResult)
      }

      setError(null)
    } catch (err) {
      console.error("Error converting to ASCII:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setAsciiArt("")
      setColoredAsciiArt([])
    }
  }

  const downloadAsciiArt = () => {
    if (!asciiArt) {
      setError("No ASCII art to download")
      return
    }

    const element = document.createElement("a")
    const file = new Blob([asciiArt], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "ascii-art.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Render ASCII art to div
  const renderAsciiArt = () => {
    if (!asciiArt && coloredAsciiArt.length === 0) {
      return <div className={`text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No ASCII art generated</div>
    }

    // Different font sizes based on conversion mode
    const fontSize = conversionMode === "braille" ? "8px" : "12px"
    const lineHeight = conversionMode === "braille" ? "8px" : "12px"

    if (grayscale) {
      return (
        <pre
          className="font-mono text-left whitespace-pre select-text"
          style={{
            fontSize,
            lineHeight,
            color: darkMode ? "white" : "black",
            margin: 0,
            padding: "20px",
          }}
        >
          {asciiArt}
        </pre>
      )
    } else {
      return (
        <div
          className="font-mono text-left select-text"
          style={{
            fontSize,
            lineHeight,
            margin: 0,
            padding: "20px",
          }}
        >
          {coloredAsciiArt.map((row, rowIndex) => (
            <div key={rowIndex} style={{ margin: 0, padding: 0, height: lineHeight }}>
              {row.map((col, colIndex) => (
                <span key={colIndex} style={{ color: col.color }}>
                  {col.char}
                </span>
              ))}
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div className={`min-h-screen w-full ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      <div
        ref={containerRef}
        className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden select-none"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ASCII Art Preview */}
        <div
          ref={previewRef}
          className={`order-1 md:order-2 flex-1 overflow-auto flex items-start justify-center ${
            isDraggingFile ? "bg-opacity-50" : ""
          } relative p-4`}
          style={{
            backgroundColor: darkMode ? "black" : "white",
            ...(isHydrated && isDesktop
              ? {
                  width: `${100 - leftPanelWidth}%`,
                  marginLeft: `${leftPanelWidth}%`,
                }
              : {}),
          }}
        >
          {isDraggingFile && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10 select-none">
              <div className="text-white text-xl font-mono">Drop image here</div>
            </div>
          )}

          <div className="w-full max-w-full">
            {loading ? (
              <div className={`${darkMode ? "text-white" : "text-black"} font-mono select-none text-center`}>
                Loading image...
              </div>
            ) : error ? (
              <div className="text-red-400 font-mono p-4 text-center select-none">
                {error}
                <div className={`mt-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Try uploading a different image or refreshing the page.
                </div>
              </div>
            ) : (
              <div
                className="w-full"
                style={{
                  backgroundColor: darkMode ? "black" : "white",
                  border: `1px solid ${darkMode ? "#374151" : "#d1d5db"}`,
                  borderRadius: "4px",
                  minHeight: "200px",
                }}
              >
                {renderAsciiArt()}
              </div>
            )}
          </div>
        </div>

        {/* Resizable divider */}
        {isHydrated && isDesktop && (
          <div
            className={`order-3 w-2 cursor-col-resize items-center justify-center z-10 transition-colors duration-300 ${
              darkMode ? "bg-stone-800 hover:bg-stone-700" : "bg-gray-300 hover:bg-gray-400"
            }`}
            style={{
              backgroundColor: darkMode ? "#8B6F47" : "#d1d5db",
              position: "absolute",
              left: `${leftPanelWidth}%`,
              top: 0,
              bottom: 0,
              display: "flex",
            }}
            onMouseDown={startDragging}
          >
            <GripVertical className={`h-6 w-6 ${darkMode ? "text-stone-500" : "text-gray-600"}`} />
          </div>
        )}

        {/* Control Panel */}
        <div
          className={`order-2 md:order-1 w-full md:h-auto p-2 md:p-4 font-mono transition-opacity duration-300 ${
            !isHydrated ? "opacity-0" : "opacity-100"
          } ${darkMode ? "bg-stone-900 text-stone-300 border-stone-700" : "bg-gray-50 text-gray-700 border-gray-300"}`}
          style={{
            backgroundColor: darkMode ? "#4A3429" : "#f9fafb",
            color: darkMode ? "#F5E6D3" : "#374151",
            width: "100%",
            height: "auto",
            flex: "0 0 auto",
            ...(isHydrated && isDesktop
              ? {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${leftPanelWidth}%`,
                  overflowY: "auto",
                }
              : {}),
          }}
        >
          <div
            className={`space-y-4 p-2 md:p-4 border rounded-md ${darkMode ? "border-stone-700" : "border-gray-300"}`}
            style={{
              borderColor: darkMode ? "#8B6F47" : "#d1d5db",
            }}
          >
            <div className="space-y-1">
              <h1 className={`text-lg font-bold ${darkMode ? "text-stone-100" : "text-gray-900"}`}>Braillite</h1>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <div className="space-y-4 pt-2">
              {/* Theme Toggle */}
              <div
                className={`flex items-center space-x-2 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                style={{
                  borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                }}
              >
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-stone-600"
                />
                <Label htmlFor="darkMode" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                  Dark Mode
                </Label>
              </div>

              {/* Conversion Mode Selector */}
              <div
                className={`space-y-2 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
              >
                <Label htmlFor="conversionMode" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                  Conversion Mode
                </Label>
                <Select value={conversionMode} onValueChange={setConversionMode}>
                  <SelectTrigger
                    id="conversionMode"
                    className={`${darkMode ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-gray-300 text-gray-700"}`}
                    style={{
                      backgroundColor: darkMode ? "#6B4E3D" : "white",
                      borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                      color: darkMode ? "#F5E6D3" : "#374151",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className={`${darkMode ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-gray-300 text-gray-700"}`}
                    style={{
                      backgroundColor: darkMode ? "#6B4E3D" : "white",
                      borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                      color: darkMode ? "#F5E6D3" : "#374151",
                    }}
                  >
                    <SelectItem value="ascii">ASCII Characters</SelectItem>
                    <SelectItem value="braille">Braille Patterns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {conversionMode === "ascii" && (
                <>
                  <div
                    className={`space-y-2 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                    style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="resolution" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                        Resolution: {resolution.toFixed(2)}
                      </Label>
                    </div>
                    <Slider
                      id="resolution"
                      min={0.05}
                      max={0.3}
                      step={0.01}
                      value={[resolution]}
                      onValueChange={(value) => setResolution(value[0])}
                      className="[&>span]:border-none [&_.bg-primary]:bg-stone-800 [&>.bg-background]:bg-stone-500/30"
                    />
                  </div>

                  <div
                    className={`space-y-2 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                    style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
                  >
                    <Label htmlFor="charset" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                      Character Set
                    </Label>
                    <Select value={charSet} onValueChange={setCharSet}>
                      <SelectTrigger
                        id="charset"
                        className={`${darkMode ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-gray-300 text-gray-700"}`}
                        style={{
                          backgroundColor: darkMode ? "#6B4E3D" : "white",
                          borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                          color: darkMode ? "#F5E6D3" : "#374151",
                        }}
                      >
                        <SelectValue placeholder="Select character set" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${darkMode ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-gray-300 text-gray-700"}`}
                        style={{
                          backgroundColor: darkMode ? "#6B4E3D" : "white",
                          borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                          color: darkMode ? "#F5E6D3" : "#374151",
                        }}
                      >
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="blocks">Block Characters</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div
                className={`flex items-center space-x-2 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
              >
                <Switch
                  id="invert"
                  checked={inverted}
                  onCheckedChange={setInverted}
                  className="data-[state=checked]:bg-stone-600"
                />
                <Label htmlFor="invert" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                  Invert Colors
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
              >
                <Switch
                  id="grayscale"
                  checked={grayscale}
                  onCheckedChange={setGrayscale}
                  className="data-[state=checked]:bg-stone-600"
                />
                <Label htmlFor="grayscale" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                  Grayscale Mode
                </Label>
              </div>

              <div className="hidden">
                <canvas ref={canvasRef} width="300" height="300"></canvas>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              <div
                className={`flex gap-2 pt-4 border-t ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
              >
                <Button
                  onClick={() => {
                    if (!asciiArt) {
                      setError("No ASCII art to copy")
                      return
                    }
                    navigator.clipboard
                      .writeText(asciiArt)
                      .then(() => {
                        alert("ASCII art copied to clipboard!")
                      })
                      .catch(() => {
                        // Fallback for older browsers
                        const el = document.createElement("textarea")
                        el.value = asciiArt
                        document.body.appendChild(el)
                        el.select()
                        document.execCommand("copy")
                        document.body.removeChild(el)
                        alert("ASCII art copied to clipboard!")
                      })
                  }}
                  className={`flex-1 text-stone-200 border-stone-600 ${darkMode ? "bg-stone-700 hover:bg-stone-600" : "bg-gray-600 hover:bg-gray-700 text-white"}`}
                  style={{
                    backgroundColor: darkMode ? "#8B6F47" : "#4b5563",
                    color: darkMode ? "#F5E6D3" : "white",
                  }}
                  className="flex-1 hover:opacity-90"
                  disabled={loading || !imageLoaded}
                >
                  {sidebarNarrow ? "Copy" : "Copy ASCII Art"}
                </Button>

                <Button
                  onClick={downloadAsciiArt}
                  className={`flex-1 text-stone-200 border-stone-600 ${darkMode ? "bg-stone-700 hover:bg-stone-600" : "bg-gray-600 hover:bg-gray-700 text-white"}`}
                  style={{
                    backgroundColor: darkMode ? "#8B6F47" : "#4b5563",
                    color: darkMode ? "#F5E6D3" : "white",
                  }}
                  className="hover:opacity-90"
                  title="Download ASCII Art"
                  disabled={loading || !imageLoaded || !asciiArt}
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 text-stone-200 border-stone-600 ${darkMode ? "bg-stone-700 hover:bg-stone-600" : "bg-gray-600 hover:bg-gray-700 text-white"}`}
                  style={{
                    backgroundColor: darkMode ? "#8B6F47" : "#4b5563",
                    color: darkMode ? "#F5E6D3" : "white",
                  }}
                  className="hover:opacity-90"
                  title="Upload Image"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Advanced Braille Options Panel */}
            {conversionMode === "braille" && (
              <div
                className={`space-y-4 border-t pt-4 ${darkMode ? "border-stone-700" : "border-gray-300"}`}
                style={{ borderColor: darkMode ? "#8B6F47" : "#d1d5db" }}
              >
                <h3 className={`font-semibold ${darkMode ? "text-stone-100" : "text-gray-900"}`}>Advanced Options</h3>

                {/* Width Control */}
                <div className="space-y-2">
                  <Label htmlFor="width" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                    Width: {width} chars
                  </Label>
                  <Slider
                    id="width"
                    min={50}
                    max={400}
                    step={10}
                    value={[width]}
                    onValueChange={(value) => setWidth(value[0])}
                    className="[&>span]:border-none [&_.bg-primary]:bg-stone-800 [&>.bg-background]:bg-stone-500/30"
                  />
                </div>

                {/* Color Calculation Method */}
                <div className="space-y-2">
                  <Label htmlFor="colorCalc" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                    Color Calculation
                  </Label>
                  <Select value={colorCalc} onValueChange={setColorCalc}>
                    <SelectTrigger
                      id="colorCalc"
                      className={`${darkMode ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-gray-300 text-gray-700"}`}
                      style={{
                        backgroundColor: darkMode ? "#6B4E3D" : "white",
                        borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                        color: darkMode ? "#F5E6D3" : "#374151",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className={`${darkMode ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-gray-300 text-gray-700"}`}
                      style={{
                        backgroundColor: darkMode ? "#6B4E3D" : "white",
                        borderColor: darkMode ? "#8B6F47" : "#d1d5db",
                        color: darkMode ? "#F5E6D3" : "#374151",
                      }}
                    >
                      <SelectItem value="RGBsum">RGB Sum</SelectItem>
                      <SelectItem value="R">Red Channel</SelectItem>
                      <SelectItem value="G">Green Channel</SelectItem>
                      <SelectItem value="B">Blue Channel</SelectItem>
                      <SelectItem value="BW">Black & White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dither"
                      checked={dither}
                      onCheckedChange={setDither}
                      className="data-[state=checked]:bg-stone-600"
                    />
                    <Label htmlFor="dither" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                      Use Dithering
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoContrast"
                      checked={autoContrast}
                      onCheckedChange={setAutoContrast}
                      className="data-[state=checked]:bg-stone-600"
                    />
                    <Label htmlFor="autoContrast" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                      Auto Contrast
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="noEmpty"
                      checked={noEmpty}
                      onCheckedChange={setNoEmpty}
                      className="data-[state=checked]:bg-stone-600"
                    />
                    <Label htmlFor="noEmpty" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                      No Empty Patterns
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="blankMode"
                      checked={blankMode}
                      onCheckedChange={setBlankMode}
                      className="data-[state=checked]:bg-stone-600"
                    />
                    <Label htmlFor="blankMode" className={darkMode ? "text-stone-300" : "text-gray-700"}>
                      Blank Mode (Color Only)
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
