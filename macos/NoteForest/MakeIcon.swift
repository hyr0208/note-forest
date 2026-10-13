import AppKit

let size = 1024
let image = NSImage(size: NSSize(width: size, height: size))
image.lockFocus()

NSColor(calibratedRed: 0.447, green: 0.533, blue: 0.42, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: size, height: size), xRadius: 290, yRadius: 290).fill()

let leaf = NSBezierPath()
leaf.move(to: NSPoint(x: 465, y: 245))
leaf.curve(to: NSPoint(x: 715, y: 775), controlPoint1: NSPoint(x: 815, y: 750), controlPoint2: NSPoint(x: 780, y: 510))
leaf.curve(to: NSPoint(x: 465, y: 245), controlPoint1: NSPoint(x: 600, y: 780), controlPoint2: NSPoint(x: 470, y: 510))
NSColor(calibratedRed: 0.973, green: 0.973, blue: 0.945, alpha: 1).setFill()
leaf.fill()

let stem = NSBezierPath()
stem.move(to: NSPoint(x: 330, y: 225))
stem.curve(to: NSPoint(x: 605, y: 610), controlPoint1: NSPoint(x: 400, y: 430), controlPoint2: NSPoint(x: 500, y: 555))
stem.lineWidth = 42
stem.lineCapStyle = .round
NSColor(calibratedRed: 0.875, green: 0.906, blue: 0.847, alpha: 1).setStroke()
stem.stroke()

image.unlockFocus()
guard let tiff = image.tiffRepresentation else {
    fatalError("Could not render the Note Forest icon")
}
try tiff.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
