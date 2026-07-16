/**
 * Authorized SabreDesign listing images, copied into the storefront so product
 * pages do not depend on MakerWorld being available at request time.
 */
const sabreDesignImage = (filename: string) =>
  `/products/sabredesign/${filename}`;

export const sabreDesignPaperTowelHolderImages = [
  sabreDesignImage("japandi-paper-towel-holder-01.webp"),
  sabreDesignImage("japandi-paper-towel-holder-02.webp"),
  sabreDesignImage("japandi-paper-towel-holder-03.webp"),
  sabreDesignImage("japandi-paper-towel-holder-04.webp"),
  sabreDesignImage("japandi-paper-towel-holder-05.webp"),
  sabreDesignImage("japandi-paper-towel-holder-06.webp"),
  sabreDesignImage("japandi-paper-towel-holder-07.webp"),
] as const;

export const sabreDesignJapandiTrayImages = [
  sabreDesignImage("japandi-tray-01.webp"),
  sabreDesignImage("japandi-tray-02.webp"),
  sabreDesignImage("japandi-tray-03.webp"),
  sabreDesignImage("japandi-tray-04.webp"),
] as const;

export const sabreDesignAcornContainerImages = [
  sabreDesignImage("acorn-container-01.webp"),
  sabreDesignImage("acorn-container-02.webp"),
  sabreDesignImage("acorn-container-03.webp"),
  sabreDesignImage("acorn-container-04.webp"),
] as const;

export const sabreDesignMushroomContainerImages = [
  sabreDesignImage("japandi-mushroom-container-01.webp"),
  sabreDesignImage("japandi-mushroom-container-02.webp"),
  sabreDesignImage("japandi-mushroom-container-03.webp"),
  sabreDesignImage("japandi-mushroom-container-04.webp"),
  sabreDesignImage("japandi-mushroom-container-05.webp"),
  sabreDesignImage("japandi-mushroom-container-06.webp"),
] as const;

export const sabreDesignJunoTrayImages = [
  sabreDesignImage("juno-display-tray-01.webp"),
  sabreDesignImage("juno-display-tray-02.webp"),
  sabreDesignImage("juno-display-tray-03.webp"),
  sabreDesignImage("juno-display-tray-04.webp"),
] as const;

export const sabreDesignPhoneStandImages = [
  sabreDesignImage("sculptural-phone-stand-01.webp"),
  sabreDesignImage("sculptural-phone-stand-02.webp"),
  sabreDesignImage("sculptural-phone-stand-03.webp"),
  sabreDesignImage("sculptural-phone-stand-04.webp"),
  sabreDesignImage("sculptural-phone-stand-05.webp"),
  sabreDesignImage("sculptural-phone-stand-06.webp"),
  sabreDesignImage("sculptural-phone-stand-07.webp"),
] as const;
