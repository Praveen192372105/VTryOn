import ast
from pathlib import Path

FORBIDDEN_IMPORTS = {"torch", "torchvision", "diffusers", "transformers", "CatVTON", "detectron2", "model"}


def find_python_files(root: Path) -> list[Path]:
    return [p for p in root.rglob("*.py") if "__pycache__" not in p.parts]


def get_imports_from_file(file_path: Path) -> set[str]:
    content = file_path.read_text(encoding="utf-8")
    tree = ast.parse(content, filename=str(file_path))
    imported_modules = set()

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imported_modules.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imported_modules.add(node.module.split(".")[0])

    return imported_modules


def test_api_layer_does_not_import_gpu_or_model_modules():
    """Ensure HTTP route layer never imports heavy AI/GPU packages or CatVTON internals."""
    backend_root = Path(__file__).parent.parent.parent
    api_dir = backend_root / "app" / "api"
    api_files = find_python_files(api_dir)

    for file_path in api_files:
        imports = get_imports_from_file(file_path)
        violations = imports.intersection(FORBIDDEN_IMPORTS)
        assert not violations, f"Layer boundary violation: {file_path.name} imports forbidden modules: {violations}"


def test_repository_layer_does_not_import_gpu_or_model_modules():
    """Ensure database repository layer never imports heavy AI/GPU packages or CatVTON internals."""
    backend_root = Path(__file__).parent.parent.parent
    repo_dir = backend_root / "app" / "repositories"
    repo_files = find_python_files(repo_dir)

    for file_path in repo_files:
        imports = get_imports_from_file(file_path)
        violations = imports.intersection(FORBIDDEN_IMPORTS)
        assert not violations, f"Layer boundary violation: {file_path.name} imports forbidden modules: {violations}"
