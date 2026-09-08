package com.example.vtryon

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ArchitectureAuditTest {

    private val sourceRoot = File("src/main/java/com/example/vtryon")

    @Test
    fun `Presentation layer must not import Retrofit or Room`() {
        val featureDir = File(sourceRoot, "feature")
        if (!featureDir.exists()) return

        val violations = mutableListOf<String>()
        featureDir.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                val trimmed = line.trim()
                if (trimmed.startsWith("import retrofit2.") ||
                    trimmed.startsWith("import com.example.vtryon.data.remote.") ||
                    trimmed.startsWith("import androidx.room.") ||
                    trimmed.contains("Dao") && trimmed.startsWith("import com.example.vtryon.core.database.")
                ) {
                    violations.add("${file.name}:${index + 1} imports forbidden dependency: $trimmed")
                }
            }
        }
        assertTrue("Presentation layer architecture violations found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Domain layer must not import Android Views, Fragments, Retrofit, or Room`() {
        val domainDir = File(sourceRoot, "domain")
        if (!domainDir.exists()) return

        val violations = mutableListOf<String>()
        domainDir.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                val trimmed = line.trim()
                if (trimmed.startsWith("import android.view.") ||
                    trimmed.startsWith("import android.widget.") ||
                    trimmed.startsWith("import androidx.fragment.") ||
                    trimmed.startsWith("import retrofit2.") ||
                    trimmed.startsWith("import androidx.room.")
                ) {
                    violations.add("${file.name}:${index + 1} imports forbidden dependency: $trimmed")
                }
            }
        }
        assertTrue("Domain layer architecture violations found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Data layer must not import UI Fragments, Views, or NavController`() {
        val dataDir = File(sourceRoot, "data")
        if (!dataDir.exists()) return

        val violations = mutableListOf<String>()
        dataDir.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                val trimmed = line.trim()
                if (trimmed.startsWith("import android.view.") ||
                    trimmed.startsWith("import android.widget.") ||
                    trimmed.startsWith("import androidx.fragment.app.Fragment") ||
                    trimmed.startsWith("import androidx.navigation.")
                ) {
                    violations.add("${file.name}:${index + 1} imports forbidden UI dependency: $trimmed")
                }
            }
        }
        assertTrue("Data layer architecture violations found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Codebase must contain zero Google Material Design components`() {
        val violations = mutableListOf<String>()
        sourceRoot.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                val trimmed = line.trim()
                if (trimmed.startsWith("import com.google.android.material.")) {
                    violations.add("${file.name}:${index + 1} imports forbidden Material Design component: $trimmed")
                }
            }
        }

        // Check XML layout files as well across all layout directories (layout, layout-sw600dp, etc.)
        val resDir = File("src/main/res")
        if (resDir.exists()) {
            resDir.walkTopDown().filter { it.extension == "xml" && it.parentFile?.name?.startsWith("layout") == true }.forEach { file ->
                val content = file.readText()
                if (content.contains("com.google.android.material")) {
                    violations.add("${file.name} contains forbidden Google Material component declaration")
                }
            }
        }

        assertTrue("Material Design violations found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Verify no empty feature directories or speculative packages exist`() {
        val featureDir = File(sourceRoot, "feature")
        if (!featureDir.exists()) return

        val emptyDirs = mutableListOf<String>()
        val speculativePackages = setOf("favorites", "registration", "profile", "onboarding", "analytics", "payments", "notifications")

        featureDir.listFiles()?.filter { it.isDirectory }?.forEach { dir ->
            if (dir.name in speculativePackages) {
                emptyDirs.add("Speculative feature package detected: ${dir.name}")
            }
            val files = dir.walkTopDown().filter { it.isFile }.toList()
            if (files.isEmpty()) {
                emptyDirs.add("Empty feature package detected: ${dir.name}")
            }
        }

        assertTrue("Package cleanliness violations found:\n" + emptyDirs.joinToString("\n"), emptyDirs.isEmpty())
    }

    @Test
    fun `Verify zero android_R_drawable or @android_drawable references exist`() {
        val violations = mutableListOf<String>()
        val mainDir = File("src/main")
        mainDir.walkTopDown().filter { it.extension in setOf("kt", "xml") }.forEach { file ->
            val content = file.readText()
            if (content.contains("android.R.drawable") || content.contains("@android:drawable")) {
                violations.add("${file.name} references prohibited platform android.R.drawable")
            }
        }
        assertTrue("Prohibited platform drawable references found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Verify zero functional Unicode control symbols used as icons`() {
        val forbiddenUnicodeRegex = Regex("[←→↑↓♥♡✓✕⚙⋮⋯]")
        val violations = mutableListOf<String>()
        val resDir = File("src/main/res")
        resDir.walkTopDown().filter { it.extension == "xml" && it.name != "strings.xml" }.forEach { file ->
            val content = file.readText()
            if (forbiddenUnicodeRegex.containsMatchIn(content)) {
                violations.add("${file.name} contains prohibited Unicode control symbol")
            }
        }
        assertTrue("Forbidden Unicode icon symbols found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Feature code must consume semantic VtoIcon instead of direct R_drawable_vto_huge references`() {
        val featureDir = File(sourceRoot, "feature")
        if (!featureDir.exists()) return

        val violations = mutableListOf<String>()
        featureDir.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                if (line.contains("R.drawable.vto_huge_")) {
                    violations.add("${file.name}:${index + 1} accesses raw R.drawable.vto_huge directly instead of semantic VtoIcon: ${line.trim()}")
                }
            }
        }
        assertTrue("Feature code direct drawable violations found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Single-Activity principle - only AppActivity extends AppCompatActivity or Activity`() {
        val violations = mutableListOf<String>()
        sourceRoot.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                val trimmed = line.trim()
                if (file.name != "AppActivity.kt" &&
                    (trimmed.contains(": AppCompatActivity(") ||
                     trimmed.contains(": ComponentActivity(") ||
                     trimmed.contains(": Activity(") ||
                     trimmed.endsWith(": AppCompatActivity()") ||
                     trimmed.endsWith(": ComponentActivity()") ||
                     trimmed.endsWith(": Activity()"))
                ) {
                    violations.add("${file.name}:${index + 1} declares an Activity subclass in violation of Single-Activity architecture: $trimmed")
                }
            }
        }
        assertTrue("Multiple Activities detected:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Zero Material navigation widgets in codebase`() {
        val violations = mutableListOf<String>()
        val mainDir = File("src/main")
        val widgets = setOf("BottomNavigationView", "NavigationRailView", "MaterialToolbar", "NavigationView")
        mainDir.walkTopDown().filter { it.extension in setOf("kt", "xml") }.forEach { file ->
            if (file.extension == "xml") {
                val content = file.readText()
                if (widgets.any { content.contains(it) }) {
                    violations.add("${file.name} declares forbidden Material navigation component in XML")
                }
            } else if (file.extension == "kt") {
                val lines = file.readLines()
                lines.forEachIndexed { index, line ->
                    val trimmed = line.trim()
                    if (!trimmed.startsWith("*") && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
                        if (widgets.any { trimmed.contains(it) }) {
                            violations.add("${file.name}:${index + 1} references forbidden Material navigation component: $trimmed")
                        }
                    }
                }
            }
        }
        assertTrue("Material navigation violations found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Repository, datasource, and network layers must not reference NavController`() {
        val violations = mutableListOf<String>()
        listOf("data", "domain", "core/network").forEach { relPath ->
            val dir = File(sourceRoot, relPath)
            if (dir.exists()) {
                dir.walkTopDown().filter { it.extension == "kt" }.forEach { file ->
                    val content = file.readText()
                    if (content.contains("NavController") || content.contains("findNavController")) {
                        violations.add("${file.name} references NavController in data/domain layer")
                    }
                }
            }
        }
        assertTrue("Data/Domain NavController leaks found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }

    @Test
    fun `Navigation arguments must not contain Bitmaps, ByteArrays, or large DTOs`() {
        val violations = mutableListOf<String>()
        val resNavDir = File("src/main/res/navigation")
        if (resNavDir.exists()) {
            resNavDir.walkTopDown().filter { it.extension == "xml" }.forEach { file ->
                val content = file.readText()
                if (content.contains("android.graphics.Bitmap") ||
                    content.contains("byte[]") ||
                    content.contains("Parcelable")
                ) {
                    violations.add("${file.name} defines forbidden non-primitive argument type")
                }
            }
        }
        assertTrue("Forbidden navigation argument types found:\n" + violations.joinToString("\n"), violations.isEmpty())
    }
}
