import AppKit

let size: CGFloat = 1024
let scale = size / 48
func svgPoint(_ x: CGFloat, _ y: CGFloat) -> NSPoint {
    NSPoint(x: x * scale, y: size - y * scale)
}

let image = NSImage(size: NSSize(width: size, height: size))
image.lockFocus()

NSColor(calibratedRed: 0.447, green: 0.533, blue: 0.42, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: size, height: size), xRadius: 15 * scale, yRadius: 15 * scale).fill()

let leaf = NSBezierPath()
leaf.move(to: svgPoint(31.4, 12.2))
leaf.curve(to: svgPoint(15.1, 25.4), controlPoint1: svgPoint(21.7, 13.0), controlPoint2: svgPoint(15.1, 17.4))
leaf.curve(to: svgPoint(22.7, 34.1), controlPoint1: svgPoint(15.1, 30.5), controlPoint2: svgPoint(18.2, 34.1))
leaf.curve(to: svgPoint(31.4, 12.2), controlPoint1: svgPoint(31.1, 34.1), controlPoint2: svgPoint(32.7, 21.4))
leaf.close()
NSColor(calibratedRed: 0.973, green: 0.973, blue: 0.945, alpha: 1).setFill()
leaf.fill()

let stem = NSBezierPath()
stem.move(to: svgPoint(14.7, 37.1))
stem.curve(to: svgPoint(27.7, 21.4), controlPoint1: svgPoint(18, 30.1), controlPoint2: svgPoint(22.1, 25.2))
stem.lineWidth = 2.3 * scale
stem.lineCapStyle = .round
NSColor(calibratedRed: 0.875, green: 0.906, blue: 0.847, alpha: 1).setStroke()
stem.stroke()

image.unlockFocus()
guard let tiff = image.tiffRepresentation else {
    fatalError("Could not render the Note Forest icon")
}
try tiff.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
