"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          "https://carbon-relay-backend.vercel.app/DataRoute/uploadProjectData",
          {
            method: "POST",
            body: formData,
          }
        );
        const result = await response.json();
        console.log(result.message);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
