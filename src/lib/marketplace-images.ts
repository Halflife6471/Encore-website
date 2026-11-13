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
  flatbed: "/marketplace/trucks/flatbed.jpg", // stand-in: machinery on a flat trailer
  curtainside: "/marketplace/trucks/curtainside.jpg",
  container: "/marketplace/trucks/curtainside.jpg", // stand-in: long semi-trailer combination
  tipper: "/marketplace/trucks/tipper.jpg", // stand-in: tipping body being loaded
  fuel_tanker: "/marketplace/trucks/bulk.jpg", // stand-in: tank truck
  chem_tanker: "/marketplace/trucks/bulk.jpg", // stand-in: tank truck
  reefer: "/marketplace/trucks/box.jpg", // stand-in: closed box body
  lowbed: "/marketplace/trucks/lowbed.jpg",
  box: "/marketplace/trucks/box.jpg",
  bulk: "/marketplace/trucks/bulk.jpg",
};
export const CARGO_PHOTOS: Partial<Record<CargoType, string>> = {};
