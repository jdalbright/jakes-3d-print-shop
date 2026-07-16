"use client";

import { useId, useRef, useState } from "react";
import type { StoreProduct } from "../lib/types";
import { productImageDimensions, ProductVisual } from "./ProductVisual";

export function ProductGallery({ product }: { product: StoreProduct }) {
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const galleryStatusId = useId();
  const activeImage = images[activeIndex];
  const activeDimensions = activeImage ? productImageDimensions(activeImage) : null;

  function moveImage(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  function openViewer() {
    dialogRef.current?.showModal();
    closeRef.current?.focus();
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
          <img
            className="gallery-active-image"
            key={activeImage}
            src={activeImage}
            alt={`${product.name}, view ${activeIndex + 1} of ${images.length}`}
            width={activeDimensions?.width}
            height={activeDimensions?.height}
            loading={activeIndex === 0 ? "eager" : "lazy"}
            fetchPriority={activeIndex === 0 ? "high" : "auto"}
            decoding="async"
          />
          <span className="gallery-index" aria-hidden="true">
            {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
          <span className="gallery-expand" aria-hidden="true">View larger</span>
        </button>
      ) : (
        <ProductVisual product={product} detail />
      )}

      {images.length > 1 ? (
        <>
          <div className="gallery-strip" role="group" aria-label={`${product.name} image gallery`}>
            {images.map((image, index) => {
              const dimensions = productImageDimensions(image);
              return (
                <button
                  className={activeIndex === index ? "selected" : ""}
                  key={image}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-pressed={activeIndex === index}
                  aria-current={activeIndex === index ? "true" : undefined}
                  aria-describedby={galleryStatusId}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    width={dimensions.width}
                    height={dimensions.height}
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                  />
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
          <p className="sr-only" id={galleryStatusId} aria-live="polite" aria-atomic="true">
            Image {activeIndex + 1} of {images.length} selected.
          </p>
        </>
      ) : null}

      {activeImage ? (
        <dialog
          className="gallery-dialog"
          ref={dialogRef}
          aria-label={`${product.name} full-size image viewer`}
          onClose={() => openerRef.current?.focus()}
          onKeyDown={(event) => {
            if (images.length < 2) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              moveImage(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              moveImage(1);
            }
          }}
        >
          <button className="gallery-close" onClick={closeViewer} ref={closeRef} type="button" aria-label="Close image viewer">Close</button>
          {images.length > 1 ? (
            <button className="gallery-previous" onClick={() => moveImage(-1)} type="button" aria-label="Show previous image">←</button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="gallery-active-image"
            key={activeImage}
            src={activeImage}
            alt={`${product.name}, enlarged view ${activeIndex + 1} of ${images.length}`}
            width={activeDimensions?.width}
            height={activeDimensions?.height}
            loading="lazy"
            decoding="async"
          />
          {images.length > 1 ? (
            <button className="gallery-next" onClick={() => moveImage(1)} type="button" aria-label="Show next image">→</button>
          ) : null}
          <p>{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</p>
        </dialog>
      ) : null}
    </div>
  );
}
