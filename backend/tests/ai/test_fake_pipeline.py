from pathlib import Path
from PIL import Image
import pytest

from app.ai.catvton.postprocessing import encode_tryon_result
from app.ai.catvton.types import TryOnInput, TryOnOutput


class FakeCatVTONPipeline:
    """Mock pipeline implementing CatVTON inference without requiring CUDA or weights."""
    def __init__(self):
        self.device = "cpu"

    def generate(self, tryon_input: TryOnInput) -> TryOnOutput:
        # Generate a synthetic RGB image
        img = Image.new("RGB", (768, 1024), color=(180, 210, 240))
        return TryOnOutput(
            image=img,
            width=768,
            height=1024,
            duration_ms=50.0,
        )


@pytest.mark.unit
def test_fake_pipeline_generation(tmp_path: Path):
    person_path = tmp_path / "person.jpg"
    garment_path = tmp_path / "garment.jpg"

    # Create dummy source images
    Image.new("RGB", (512, 512), color="red").save(person_path)
    Image.new("RGB", (512, 512), color="blue").save(garment_path)

    fake_pipe = FakeCatVTONPipeline()
    inp = TryOnInput(
        person_path=person_path,
        garment_path=garment_path,
        garment_category="upper_body",
    )
    output = fake_pipe.generate(inp)

    assert output.width == 768
    assert output.height == 1024
    assert output.image.size == (768, 1024)

    # Validate postprocessing encoding
    encoded = encode_tryon_result(output.image, format="JPEG", quality=95)
    assert encoded.width == 768
    assert encoded.height == 1024
    assert encoded.size_bytes > 0
    assert encoded.sha256 is not None
    assert encoded.mime_type == "image/jpeg"
