import { useEffect, useState } from "react";
import { getCameras } from "../services/cameraservice";

export default function CameraGrid() {

  const [cameras, setCameras] = useState([]);

  useEffect(() => {

    async function loadCameras() {

      try {
        const data = await getCameras();

        setCameras(data);
      } catch (error) {
        console.error(error);
      }

    }

    loadCameras();

  }, []);

  return (
    <div>
      {cameras.map((camera) => (
        <div key={camera.id}>
          {camera.name}
        </div>
      ))}
    </div>
  );
}