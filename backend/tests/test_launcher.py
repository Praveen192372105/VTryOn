import sys

from app.utils.network import (
    format_service_url,
    get_connectivity_info,
    is_usable_lan_ipv4,
    is_valid_ipv4,
    redact_url_credentials,
)
from start import (
    build_celery_cmd,
    build_fastapi_cmd,
    parse_arguments,
)


class TestNetworkUtils:
    def test_is_valid_ipv4(self):
        assert is_valid_ipv4("192.168.1.1") is True
        assert is_valid_ipv4("10.0.0.1") is True
        assert is_valid_ipv4("127.0.0.1") is True
        assert is_valid_ipv4("256.0.0.1") is False
        assert is_valid_ipv4("not-an-ip") is False
        assert is_valid_ipv4("2001:db8::1") is False  # IPv6

    def test_is_usable_lan_ipv4(self):
        # Usable RFC 1918 private subnets
        assert is_usable_lan_ipv4("192.168.1.50") is True
        assert is_usable_lan_ipv4("10.0.2.15") is True
        assert is_usable_lan_ipv4("172.20.10.2") is True

        # Excluded non-LAN / special addresses
        assert is_usable_lan_ipv4("127.0.0.1") is False  # Loopback
        assert is_usable_lan_ipv4("127.10.20.30") is False  # Loopback range
        assert is_usable_lan_ipv4("169.254.10.5") is False  # Link-local APIPA
        assert is_usable_lan_ipv4("224.0.0.1") is False  # Multicast
        assert is_usable_lan_ipv4("0.0.0.0") is False  # Unspecified
        assert is_usable_lan_ipv4("8.8.8.8") is False  # Public IP

    def test_format_service_url(self):
        assert format_service_url("127.0.0.1", 8000) == "http://127.0.0.1:8000"
        assert format_service_url("192.168.1.42", 8000, "docs") == "http://192.168.1.42:8000/docs"
        assert (
            format_service_url("192.168.1.42", 8000, "/api/v1/health/live")
            == "http://192.168.1.42:8000/api/v1/health/live"
        )
        assert format_service_url("example.com", 443, scheme="https") == "https://example.com:443"

    def test_redact_url_credentials(self):
        db_url = "mysql+pymysql://admin:supersecret@127.0.0.1:3306/vtryon"
        assert redact_url_credentials(db_url) == "mysql+pymysql://admin:***@127.0.0.1:3306/vtryon"

        redis_url = "redis://:mypassword@127.0.0.1:6379/0"
        assert redact_url_credentials(redis_url) == "redis://:***@127.0.0.1:6379/0"

        clean_url = "http://127.0.0.1:8000"
        assert redact_url_credentials(clean_url) == "http://127.0.0.1:8000"

    def test_get_connectivity_info(self):
        info = get_connectivity_info(
            bind_host="0.0.0.0",
            port=8000,
            dev_lan_override="192.168.1.99",
        )
        assert info.bind_host == "0.0.0.0"
        assert info.port == 8000
        assert info.local_url == "http://127.0.0.1:8000"
        assert info.local_swagger_url == "http://127.0.0.1:8000/docs"
        assert info.emulator_url == "http://10.0.2.2:8000"
        assert "192.168.1.99" in info.lan_candidates
        assert "http://192.168.1.99:8000" in info.lan_urls


class TestLauncherCommandsAndArgs:
    def test_default_argument_parsing(self):
        config = parse_arguments([])
        assert config.host == "0.0.0.0"
        assert config.port == 8000
        assert config.start_api is True
        assert config.start_worker is True
        assert config.info_only is False

    def test_api_only_and_no_worker_flags(self):
        config1 = parse_arguments(["--api-only"])
        assert config1.start_api is True
        assert config1.start_worker is False

        config2 = parse_arguments(["--no-worker"])
        assert config2.start_api is True
        assert config2.start_worker is False

    def test_worker_only_flag(self):
        config = parse_arguments(["--worker-only"])
        assert config.start_api is False
        assert config.start_worker is True

    def test_port_and_host_overrides(self):
        config = parse_arguments(["--host", "127.0.0.1", "--port", "9000"])
        assert config.host == "127.0.0.1"
        assert config.port == 9000

    def test_info_flag(self):
        config = parse_arguments(["--info"])
        assert config.info_only is True

    def test_build_fastapi_cmd(self):
        cmd = build_fastapi_cmd("0.0.0.0", 8000, reload=False)
        assert cmd[0] == sys.executable
        assert cmd[1:3] == ["-m", "uvicorn"]
        assert "app.main:app" in cmd
        assert "--host" in cmd
        assert "0.0.0.0" in cmd
        assert "--port" in cmd
        assert "8000" in cmd
        assert "--reload" not in cmd

        cmd_reload = build_fastapi_cmd("127.0.0.1", 8080, reload=True)
        assert "--reload" in cmd_reload

    def test_build_celery_cmd(self):
        cmd = build_celery_cmd(queue="gpu", concurrency=1, log_level="INFO")
        assert cmd[0] == sys.executable
        assert cmd[1:3] == ["-m", "celery"]
        assert "-A" in cmd
        assert "app.workers.celery_app.celery_app" in cmd
        assert "worker" in cmd
        assert "-Q" in cmd
        assert "gpu" in cmd
        assert "-c" in cmd
        assert "1" in cmd

        if sys.platform == "win32":
            assert "-P" in cmd
            assert "solo" in cmd


class TestLoggingColor:
    def test_status_color_codes(self):
        from app.core.logging import format_colored_status

        # 2xx should have green \033[1;32m
        s200 = format_colored_status(200)
        assert "\033[1;32m" in s200
        assert "200" in s200

        # 3xx should have cyan \033[1;36m
        s304 = format_colored_status(304)
        assert "\033[1;36m" in s304
        assert "304" in s304

        # 4xx should have yellow \033[1;33m
        s404 = format_colored_status(404)
        assert "\033[1;33m" in s404
        assert "404" in s404

        # 5xx should have red \033[1;31m
        s500 = format_colored_status(500)
        assert "\033[1;31m" in s500
        assert "500" in s500

    def test_method_color_codes(self):
        from app.core.logging import format_colored_method

        m_get = format_colored_method("GET")
        assert "\033[1;34m" in m_get

        m_post = format_colored_method("POST")
        assert "\033[1;32m" in m_post

        m_del = format_colored_method("DELETE")
        assert "\033[1;31m" in m_del
