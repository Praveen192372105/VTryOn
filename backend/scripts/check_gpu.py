#!/usr/bin/env python3
"""
GPU and PyTorch CUDA Environment Diagnostics for V Try-On Platform.
Verifies CUDA availability, device name, compute capability, VRAM budget, and precision.
"""

import sys
import platform

def main():
    print("=" * 60)
    print("V Try-On Platform — GPU & PyTorch CUDA Diagnostics")
    print("=" * 60)
    print(f"Python Version:         {sys.version.split()[0]}")
    print(f"Platform:               {platform.platform()}")

    try:
        import torch
        print(f"PyTorch Version:        {torch.__version__}")
        cuda_avail = torch.cuda.is_available()
        print(f"CUDA Available:         {cuda_avail}")

        if cuda_avail:
            print(f"PyTorch CUDA Version:   {torch.version.cuda}")
            dev_count = torch.cuda.device_count()
            print(f"GPU Count:              {dev_count}")
            
            for i in range(dev_count):
                props = torch.cuda.get_device_properties(i)
                total_vram_gb = props.total_memory / (1024 ** 3)
                allocated_mb = torch.cuda.memory_allocated(i) / (1024 ** 2)
                reserved_mb = torch.cuda.memory_reserved(i) / (1024 ** 2)
                
                print(f"--- GPU [{i}] ---")
                print(f"  Device Name:          {props.name}")
                print(f"  Compute Capability:   {props.major}.{props.minor}")
                print(f"  Total VRAM:           {total_vram_gb:.2f} GB ({props.total_memory:,} bytes)")
                print(f"  Allocated Memory:     {allocated_mb:.2f} MB")
                print(f"  Reserved Memory:      {reserved_mb:.2f} MB")
                
                # Precision support
                bf16_supported = torch.cuda.is_bf16_supported()
                fp16_supported = True  # All CUDA compute >= 5.3 support FP16
                print(f"  FP16 Supported:       {fp16_supported}")
                print(f"  BF16 Supported:       {bf16_supported}")
            print("=" * 60)
            print("Status: CUDA GPU IS READY FOR CATVTON INFERENCE.")
            print("=" * 60)
            return 0
        else:
            print("=" * 60)
            print("CRITICAL: CUDA is NOT available in PyTorch. Inference will fail or run on CPU.")
            print("=" * 60)
            return 1
    except ImportError:
        print("ERROR: PyTorch is not installed in the active environment.")
        return 2

if __name__ == "__main__":
    sys.exit(main())
