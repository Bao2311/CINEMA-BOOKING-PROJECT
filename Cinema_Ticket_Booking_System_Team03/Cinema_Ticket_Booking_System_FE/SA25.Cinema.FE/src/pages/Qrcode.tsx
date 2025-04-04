import React, { useState, useRef, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Define main component
const QRCodePage: React.FC = () => {
  // State management
  const [text, setText] = useState<string>('');
  const [size, setSize] = useState<number>(200);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<string>('M');
  const [color, setColor] = useState<string>('#000000');
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [margin, setMargin] = useState<number>(4);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('qrcode');
  const [shouldGenerateQR, setShouldGenerateQR] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('png');
  const [includeText, setIncludeText] = useState<boolean>(false);
  const [textPosition, setTextPosition] = useState<string>('bottom');


  // References
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  // Generate QR code function
  const generateQRCode = async () => {
    if (!text) return;
   
    setIsLoading(true);
   
    try {
      // Load the QRCode library dynamically
      const QRCode = await import('qrcode');
     
      // Options for QR code generation
      const options = {
        errorCorrectionLevel: errorCorrectionLevel,
        margin: margin,
        color: {
          dark: color,
          light: backgroundColor,
        },
        width: size,
      };
     
      // Generate QR code as data URL
      const dataURL = await QRCode.toDataURL(text, options);
      setQrCodeURL(dataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
 
  // Trigger QR code generation when button is clicked
  useEffect(() => {
    if (shouldGenerateQR) {
      generateQRCode();
      setShouldGenerateQR(false);
    }
  }, [shouldGenerateQR]);


  // Handle input change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setText(e.target.value);
  };


  // Handle size change
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSize(Number(e.target.value));
  };


  // Handle error correction level change
  const handleErrorCorrectionLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setErrorCorrectionLevel(e.target.value);
  };


  // Handle color change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };


  // Handle background color change
  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(e.target.value);
  };


  // Handle margin change
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMargin(Number(e.target.value));
  };


  // Handle file name change
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value);
  };


  // Handle format change
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormat(e.target.value);
  };


  // Handle text inclusion toggle
  const handleIncludeTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeText(e.target.checked);
  };


  // Handle text position change
  const handleTextPositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTextPosition(e.target.value);
  };


  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeURL) {
      toast.warning('Please generate a QR code first.');
      return;
    }


    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
   
    image.onload = () => {
      // Basic canvas setup
      canvas.width = size;
      canvas.height = includeText ? size + 40 : size;
     
      if (!ctx) {
        toast.error('Failed to create canvas context. Please try again.');
        return;
      }
     
      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
     
      // Draw QR code
      ctx.drawImage(image, 0, 0, size, size);
     
      // Add text if needed
      if (includeText && text) {
        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
       
        if (textPosition === 'bottom') {
          ctx.fillText(text.length > 25 ? text.substring(0, 25) + '...' : text, size / 2, size + 25);
        } else if (textPosition === 'top') {
          // Move QR code down and put text on top
          ctx.clearRect(0, 0, canvas.width, 40);
          ctx.fillText(text.length > 25 ? text.substring(0, 25) + '...' : text, size / 2, 25);
          ctx.drawImage(image, 0, 40, size, size);
        }
      }
     
      // Generate download link
      let downloadLink = canvas.toDataURL(`image/${selectedFormat}`);
     
      // For SVG, we need additional processing
      if (selectedFormat === 'svg') {
        // Convert our canvas to SVG content
        // This is a simplified approach - for more complex SVG generation, use a dedicated library
        const svgData = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <image href="${downloadLink}" width="${canvas.width}" height="${canvas.height}" />
          </svg>
        `;
        downloadLink = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      }
     
      // Create download element
      const downloadElement = document.createElement('a');
      downloadElement.href = downloadLink;
      downloadElement.download = `${fileName}.${selectedFormat}`;
      document.body.appendChild(downloadElement);
      downloadElement.click();
      document.body.removeChild(downloadElement);
    };
   
    image.src = qrCodeURL;
  };
 
  return (
    <div className="qr-code-generator">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-6">QR Code Generator</h1>
       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Input Settings</h2>
           
            <div className="mb-4">
              <label className="block mb-2 font-medium">Enter text or URL</label>
              <textarea
                className="w-full p-2 border rounded-md h-24"
                value={text}
                onChange={handleTextChange}
                placeholder="Enter text or URL to encode in QR code"
              />
            </div>
           
            <div className="mb-4">
              <label className="block mb-2 font-medium">File name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={fileName}
                onChange={handleFileNameChange}
                placeholder="Filename for download"
              />
            </div>
           
            <button
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 w-full font-medium"
              onClick={() => setShouldGenerateQR(true)}
              disabled={!text || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
         
          {/* QR Code Display Section */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center justify-between">
            <h2 className="text-xl font-semibold mb-4">Generated QR Code</h2>
           
            <div
              ref={qrRef}
              className="qr-code-container flex items-center justify-center bg-gray-100 rounded-md overflow-hidden"
              style={{
                width: size + margin * 2,
                height: size + margin * 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: backgroundColor
              }}
            >
              {qrCodeURL ? (
                <img
                  src={qrCodeURL}
                  alt="QR Code"
                  style={{ width: size, height: size }}
                />
              ) : (
                <div className="text-gray-400">QR code will appear here</div>
              )}
            </div>
           
            {qrCodeURL && (
              <button
                className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 w-full font-medium"
                onClick={downloadQRCode}
              >
                Download QR Code
              </button>
            )}
          </div>
        </div>
       
        {/* Advanced Settings Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2 font-medium">Size (px)</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="100"
                  max="500"
                  className="w-full mr-2"
                  value={size}
                  onChange={handleSizeChange}
                />
                <span className="w-12 text-right">{size}</span>
              </div>
            </div>
           
            <div>
              <label className="block mb-2 font-medium">Error Correction</label>
              <select
                className="w-full p-2 border rounded-md"
                value={errorCorrectionLevel}
                onChange={handleErrorCorrectionLevelChange}
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
           
            <div>
              <label className="block mb-2 font-medium">Margin</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="10"
                  className="w-full mr-2"
                  value={margin}
                  onChange={handleMarginChange}
                />
                <span className="w-12 text-right">{margin}</span>
              </div>
            </div>
           
            <div>
              <label className="block mb-2 font-medium">QR Color</label>
              <div className="flex">
                <input
                  type="color"
                  className="w-10 h-10 border"
                  value={color}
                  onChange={handleColorChange}
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded-md ml-2"
                  value={color}
                  onChange={handleColorChange}
                />
              </div>
            </div>
           
            <div>
              <label className="block mb-2 font-medium">Background Color</label>
              <div className="flex">
                <input
                  type="color"
                  className="w-10 h-10 border"
                  value={backgroundColor}
                  onChange={handleBackgroundColorChange}
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded-md ml-2"
                  value={backgroundColor}
                  onChange={handleBackgroundColorChange}
                />
              </div>
            </div>
           
            <div>
              <label className="block mb-2 font-medium">Download Format</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedFormat}
                onChange={handleFormatChange}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="svg">SVG</option>
              </select>
            </div>
           
            <div>
              <label className="block mb-2 font-medium">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={includeText}
                  onChange={handleIncludeTextChange}
                />
                Include Text in Image
              </label>
             
              {includeText && (
                <select
                  className="w-full p-2 border rounded-md mt-2"
                  value={textPosition}
                  onChange={handleTextPositionChange}
                >
                  <option value="bottom">Text at Bottom</option>
                  <option value="top">Text at Top</option>
                </select>
              )}
            </div>
          </div>
        </div>
       
        {/* Instructions Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
         
          <ol className="list-decimal pl-5 space-y-2">
            <li>Enter the text or URL you want to encode in the QR code</li>
            <li>Adjust the appearance settings as needed</li>
            <li>Click "Generate QR Code" to create your QR code</li>
            <li>Use the "Download QR Code" button to save your QR code</li>
          </ol>
         
          <div className="mt-4 p-4 bg-blue-50 rounded-md text-blue-800">
            <h3 className="font-medium">Tips:</h3>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>For better scanning, use higher error correction when adding a logo or when the QR code might get damaged</li>
              <li>Keep the text as short as possible for better scanning reliability</li>
              <li>Maintain good contrast between QR code and background colors</li>
              <li>Test your QR code with different devices to ensure it works properly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


export default QRCodePage;


