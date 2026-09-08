import ipaddress
import socket
from dataclasses import dataclass
from typing import List, Optional
from urllib.parse import urlsplit, urlunsplit


def is_valid_ipv4(address: str) -> bool:
    """Check if the string is a valid IPv4 address."""
    try:
        ip = ipaddress.ip_address(address)
        return ip.version == 4
    except ValueError:
        return False


def is_usable_lan_ipv4(address: str) -> bool:
    """
    Check if the IPv4 address is suitable for local network communication.
    Excludes loopback (127.0.0.0/8), link-local (169.254.0.0/16),
    multicast, broadcast, and reserved addresses.
    """
    try:
        ip = ipaddress.ip_address(address)
        if ip.version != 4:
            return False
        if ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
            return False
        return ip.is_private
    except ValueError:
        return False


def _get_outbound_ip() -> Optional[str]:
    """
    Discovers the local IP by opening a non-blocking UDP socket towards
    a public address (no packets are sent).
    """
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(0.5)
            s.connect(("8.8.8.8", 80))
            candidate = s.getsockname()[0]
            if is_usable_lan_ipv4(candidate):
                return candidate
    except Exception:
        pass
    return None


def discover_lan_ipv4_addresses() -> List[str]:
    """
    Discovers usable local IPv4 addresses on the current machine.
    Prioritizes active outbound routing interface and standard private subnets.
    Filters out virtual/container adapters (Docker, WSL, vEthernet, TAP) where practical.
    """
    candidates: List[str] = []
    virtual_candidates: List[str] = []

    # 1. Preferred route via active outbound socket
    outbound = _get_outbound_ip()
    if outbound:
        candidates.append(outbound)

    # 2. Inspect network interfaces (via psutil if available)
    try:
        import psutil

        for iface_name, addrs in psutil.net_if_addrs().items():
            lower_name = iface_name.lower()
            is_virtual = any(
                virt in lower_name
                for virt in ("vethernet", "docker", "wsl", "vmware", "virtualbox", "tailscale", "tap", "tun")
            )
            for addr in addrs:
                if addr.family == socket.AF_INET and is_usable_lan_ipv4(addr.address):
                    if is_virtual:
                        virtual_candidates.append(addr.address)
                    else:
                        candidates.append(addr.address)
    except Exception:
        pass

    # 3. Fallback to socket.gethostbyname_ex
    try:
        _, _, host_addrs = socket.gethostbyname_ex(socket.gethostname())
        for addr in host_addrs:
            if is_usable_lan_ipv4(addr):
                candidates.append(addr)
    except Exception:
        pass

    # Combine: primary physical candidates first, then virtual adapters as fallback
    all_ordered = candidates + virtual_candidates

    # Deduplicate while preserving order
    seen = set()
    result: List[str] = []
    for ip in all_ordered:
        if ip not in seen:
            seen.add(ip)
            result.append(ip)

    return result


def format_service_url(host: str, port: int, path: str = "", scheme: str = "http") -> str:
    """Formats a clean URL string from host, port, and optional path."""
    clean_path = ("/" + path.lstrip("/")) if path else ""
    return f"{scheme}://{host}:{port}{clean_path}"


def redact_url_credentials(raw_url: str) -> str:
    """
    Redacts password and credentials from database, Redis, or HTTP URLs
    for safe console logging and diagnostics.
    """
    if not raw_url:
        return ""
    try:
        parsed = urlsplit(raw_url)
        if not parsed.netloc:
            return raw_url

        netloc = parsed.netloc
        if "@" in netloc:
            user_info, host_port = netloc.split("@", 1)
            if ":" in user_info:
                username, _ = user_info.split(":", 1)
                netloc = f"{username}:***@{host_port}"
            else:
                netloc = f"***@{host_port}"

        return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
    except Exception:
        return "redacted://***"


def is_port_in_use(host: str, port: int, timeout: float = 0.5) -> bool:
    """
    Lightweight diagnostic check to see if a port is currently listening.
    Attempts a socket connection with a short timeout.
    """
    test_host = "127.0.0.1" if host in ("0.0.0.0", "") else host
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((test_host, port))
            return True
    except (ConnectionRefusedError, TimeoutError, OSError):
        return False


@dataclass(frozen=True)
class ConnectivityInfo:
    """Summary of local, emulator, and LAN connectivity endpoints."""

    bind_host: str
    port: int
    local_url: str
    local_swagger_url: str
    emulator_url: str
    emulator_swagger_url: str
    lan_candidates: List[str]
    lan_urls: List[str]
    lan_swagger_urls: List[str]
    preferred_lan_url: Optional[str]


def get_connectivity_info(
    bind_host: str = "0.0.0.0",
    port: int = 8000,
    dev_lan_override: Optional[str] = None,
) -> ConnectivityInfo:
    """
    Computes complete connectivity information for the backend development runtime.
    """
    local_url = format_service_url("127.0.0.1", port)
    local_swagger = format_service_url("127.0.0.1", port, "docs")
    emulator_url = format_service_url("10.0.2.2", port)
    emulator_swagger = format_service_url("10.0.2.2", port, "docs")

    detected_lan = discover_lan_ipv4_addresses()
    if dev_lan_override and dev_lan_override not in detected_lan:
        detected_lan = [dev_lan_override] + detected_lan

    lan_urls = [format_service_url(ip, port) for ip in detected_lan]
    lan_swagger_urls = [format_service_url(ip, port, "docs") for ip in detected_lan]
    preferred_lan = lan_urls[0] if lan_urls else None

    return ConnectivityInfo(
        bind_host=bind_host,
        port=port,
        local_url=local_url,
        local_swagger_url=local_swagger,
        emulator_url=emulator_url,
        emulator_swagger_url=emulator_swagger,
        lan_candidates=detected_lan,
        lan_urls=lan_urls,
        lan_swagger_urls=lan_swagger_urls,
        preferred_lan_url=preferred_lan,
    )
