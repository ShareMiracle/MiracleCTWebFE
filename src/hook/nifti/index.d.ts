declare module '@/hook/nifti' {
    interface NiftiHeader {
      dims: number[];
    }
  
    interface NiftiParams {
      _readniiCallback: (header: NiftiHeader) => void;
      _current_sliceCallback: (currentSlice: number) => void;
    }
  
    const params: NiftiParams;

    function readFile(file: File): void;

    function handleFileSelect(e: Event): void;
  
    export { params, readFile, handleFileSelect };
  }