import type { CargoType, VehicleType } from "./marketplace";

/**
 * Photos for listings. Drop a file under /public/marketplace/ and register it here; until a photo is
 * registered the UI falls back to the built-in truck illustration (trucks) or no image (loads).
 *
 *   public/marketplace/trucks/flatbed.jpg   -> TRUCK_PHOTOS.flatbed = "/marketplace/trucks/flatbed.jpg"
 *   public/marketplace/cargo/steel.jpg      -> CARGO_PHOTOS.steel   = "/marketplace/cargo/steel.jpg"
 *
 * Recommended: landscape, about 1200 x 800 px, JPEG/WebP, under 250 KB.
 */
export const TRUCK_PHOTOS: Partial<Record<VehicleType, string>> = {
  flatbed: "/marketplace/trucks/flatbed.jpg", // placeholder: machinery on a flat trailer; replace with a dedicated flatbed photo
  curtainside: "/marketplace/trucks/curtainside.jpg",
  lowbed: "/marketplace/trucks/lowbed.jpg",
  box: "/marketplace/trucks/box.jpg",
  bulk: "/marketplace/trucks/bulk.jpg",
};
export const CARGO_PHOTOS: Partial<Record<CargoType, string>> = {};
