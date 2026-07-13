"use client";

import { useRef, useState } from "react";
import type { StoreProduct } from "../lib/types";
import { ProductVisual } from "./ProductVisual";

export function ProductGallery({ product }: { product: StoreProduct }) {
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const activeImage = images[activeIndex];

  function moveImage(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  function openViewer() {
    dialogRef.current?.showModal();
  }

  function closeViewer() {
    dialogRef.current?.close();
  }

  return (
    <div className="product-gallery">
      {activeImage ? (
        <button
          className="gallery-main"
          onClick={openViewer}
          ref={openerRef}
          type="button"
          aria-label={`Open larger view of ${product.name}, image ${activeIndex + 1} of ${images.length}`}
        >
          {/* Stripe product images are merchant-controlled catalog content. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeImage} alt={`${product.name}, view ${activeIndex + 1} of ${images.length}`} />
          <span className="gallery-index" aria-hidden="true">
            {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
          <span className="gallery-expand" aria-hidden="true">View larger</span>
        </button>
      ) : (
        <ProductVisual product={product} detail />
      )}

      {images.length > 1 ? (
        <div className="gallery-strip" aria-label={`${product.name} image gallery`}>
          {images.map((image, index) => (
            <button
              className={activeIndex === index ? "selected" : ""}
              key={image}
              onClick={() => setActiveIndex(index)}
              type="button"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={activeIndex === index ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" />
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      ) : null}

      {activeImage ? (
        <dialog
          className="gallery-dialog"
          ref={dialogRef}
          aria-label={`${product.name} full-size image viewer`}
          onClose={() => openerRef.current?.focus()}
        >
          <button className="gallery-close" onClick={closeViewer} type="button" aria-label="Close image viewer">Close</button>
          {images.length > 1 ? (
            <button className="gallery-previous" onClick={() => moveImage(-1)} type="button" aria-label="Show previous image">←</button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeImage} alt={`${product.name}, enlarged view ${activeIndex + 1} of ${images.length}`} />
          {images.length > 1 ? (
            <button className="gallery-next" onClick={() => moveImage(1)} type="button" aria-label="Show next image">→</button>
          ) : null}
          <p>{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</p>
        </dialog>
      ) : null}
    </div>
  );
}
