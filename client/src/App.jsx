import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { FaCamera } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";

function App() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [user, setUser] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [username, setUsername] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [loadingCapture, setLoadingCapture] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    loadModels();
    return () => stopVideo();
  }, []);

  const loadModels = async () => {
    const modelPath = `https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights/`;
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading models:", error);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      setPopupMessage("❌ Could not access camera. Check permissions!");
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || loadingCapture) {
      setStatusMessage("Wait until models are loaded and camera is started!");
      return;
    }

    setLoadingCapture(true);
    setStatusMessage("📸 Capturing...");

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      setFaceDescriptor(detections.descriptor);
      setStatusMessage("✅ Photo Captured!");
    } else {
      setStatusMessage("❌ No Face Detected! Try Again.");
    }

    setTimeout(() => {
      setLoadingCapture(false);
    }, 100);
  };

  const handleSubmit = async () => {
    if (!faceDescriptor) {
      setPopupMessage("❌ Capture your face first!");
      return;
    }
  
    if (mode === "register" && username.trim() === "") {
      setPopupMessage("❌ Please enter a username!");
      return;
    }
  
    try {
      if (mode === "register") {
        await axios.post(import.meta.env.VITE_SERVER_URL_REGISTER, {
          username,
          descriptor: JSON.stringify(Array.from(faceDescriptor)),
        });
        setPopupMessage("✅ Registered Successfully!");
        setUsername(""); // Clear the username field
        setFaceDescriptor(null); // Reset face descriptor
      } else {
        const res = await axios.post(import.meta.env.VITE_SERVER_URL_LOGIN, {
          descriptor: JSON.stringify(Array.from(faceDescriptor)),
        });
  
        if (res.data.success) {
          setUser(res.data.username);
          setPopupMessage("✅ Login Successful!");
        } else {
          setPopupMessage("❌ Face not recognized! Try again.");
        }
      }
    } catch (err) {
      setPopupMessage("❌ Error processing request!");
    }
  };
  

  useEffect(() => {
    if (popupMessage) {
      const timer = setTimeout(() => setPopupMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative">
      <h1 className="text-3xl font-bold my-4">{mode === "register" ? "Register" : "Login"} with Face</h1>
      {user && <h2 className="text-2xl m-4">Welcome, {user}! You logged in Successfully!</h2>}

      {mode === "register" && (
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 mb-3 border border-gray-500 rounded-lg text-white"
        />
      )}

      <video ref={videoRef} autoPlay className="border-2 border-gray-500 rounded-lg shadow-lg" />

      <div className="flex space-x-4 mt-4">
        <button className="bg-blue-500 px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer" onClick={startVideo}>
          <FaCamera /> <span>Start Camera</span>
        </button>

        <button className="bg-green-500 px-4 py-2 rounded-lg cursor-pointer" onClick={captureFace} disabled={loadingCapture}>
          {loadingCapture ? "Captured!" : "Capture Face"}
        </button>

        <button className="bg-yellow-500 px-4 py-2 rounded-lg cursor-pointer" onClick={handleSubmit}>
          {mode === "register" ? "Register" : "Login"}
        </button>
      </div>

      {statusMessage && <div className="text-lg font-semibold mt-2 text-white">{statusMessage}</div>}

      <button className="mt-4 text-sm underline cursor-pointer" onClick={() => setMode(mode === "register" ? "login" : "register")}>
        {mode === "register" ? "Already registered? Login" : "New user? Register"}
      </button>

      
      {popupMessage && (
        <div className="fixed top-5 right-5 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex items-center">
          <span>{popupMessage}</span>
          <button onClick={() => setPopupMessage("")} className="ml-4 text-red-400">
            <AiOutlineClose size={20} />
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
