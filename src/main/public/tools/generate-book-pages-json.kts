import java.io.File
import javax.imageio.ImageIO

val dirWithImages = File("C:\\igye\\books\\pdf-2-png")
val fileToSaveTo = File("C:\\igye\\books\\markups\\prod\\intro-to-algs-3rd-ed.json")

val pageNumberRegex = "^.+-(\\d+)\\.png$".toRegex()
data class PageDto(val fileName: String, val width: Int, val height: Int, val pageNum: Int) {
    fun toJsonString(): String {
        return "        {\"fileName\": \"$fileName\", \"width\": $width, \"height\": $height, \"pageNum\": $pageNum }"
    }
}

val jsonContent = dirWithImages.listFiles().asSequence()
    .filter { it.name.endsWith(".png") }
    .map {
        val image = ImageIO.read(it)
        PageDto(
            fileName = it.name,
            width = image.width,
            height = image.height,
            pageNum = pageNumberRegex.matchEntire(it.name)!!.groupValues[1].toInt()
        )
    }
    .sortedBy { it.pageNum }
    .map { it.toJsonString() }
    .joinToString(
        prefix = "{\n    \"pageNumShift\": 0,\n    \"pages\": [\n",
        separator = ",\n",
        postfix = "\n    ]\n}"
    )
fileToSaveTo.writeText(jsonContent)
