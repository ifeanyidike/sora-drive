import { type File } from "@/types";
import { FileIcon, FileText } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import * as docx from "docx-preview";

type Props = {
  file: File;
  documentHeight?: string;
  width?: string;
  minimal?: boolean;
};

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
const FilePreview = ({
  file,
  documentHeight = "h-[80vh]",
  width = "w-full",
  minimal = false,
}: Props) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadWordDocument = async () => {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
        containerRef.current
      ) {
        try {
          const response = await fetch(file.url);
          const arrayBuffer = await response.arrayBuffer();
          await docx.renderAsync(arrayBuffer, containerRef.current);
          setLoading(false);
        } catch (error) {
          console.error("Error loading Word document:", error);
          setLoading(false);
        }
      }
    };

    loadWordDocument();
  }, [file.url, file.type]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const renderPreview = () => {
    if (file.type.includes("image")) {
      return (
        <div className="flex justify-center">
          <img
            src={file.url}
            alt={file.name}
            className="max-h-screen object-contain"
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return (
        <div
          ref={containerRef}
          className="bg-white p-8 max-w-4xl mx-auto shadow-lg rounded-lg"
        />
      );
    }

    if (file.type.includes("pdf")) {
      return (
        <div className="flex flex-col items-center ">
          <div
            className={`${width} ${documentHeight} overflow-auto bg-white shadow rounded`}
          >
            <Document
              file={file.url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setLoading(false)}
            >
              <Page pageNumber={pageNumber} />
            </Document>
          </div>
          {numPages && !minimal && (
            <div className="mt-4">
              <p>
                Page {pageNumber} of {numPages}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPageNumber(Math.min(numPages, pageNumber + 1))
                  }
                  disabled={pageNumber >= numPages}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center p-8">
        {file.type.includes("text") ? (
          <FileText size={96} className="text-gray-500 mb-4" />
        ) : (
          <FileIcon size={96} className="text-gray-500 mb-4" />
        )}
        <h2 className="text-xl font-semibold mb-2">{file.name}</h2>
        <p className="text-gray-500 mb-1">Type: {file.type}</p>
        <p className="text-gray-500 mb-1">
          Size: {(file.size / 1024).toFixed(2)} KB
        </p>
        <p className="text-gray-500">
          Created: {new Date(file.created_at).toLocaleDateString()}
        </p>
        <a
          href={file.url}
          download
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div
      className={`${width} flex justify-center items-center bg-gray-100 p-4`}
    >
      {renderPreview()}
    </div>
  );
};

export default observer(FilePreview);
