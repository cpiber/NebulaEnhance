
export function getBrowserInstance(): typeof chrome {
    // Get extension api Chrome or Firefox
    // @ts-ignore
    const browserInstance = window.chrome || (window as any)['browser'] || browser;
    return browserInstance;
}
