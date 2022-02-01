import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

val dirWithImages = File("C:\\igye\\books\\tmp")
val fileToSaveTo = File("C:\\igye\\books\\tmp\\basic-trig-identities.json")
val width: Int = 2550
val height: Int = 3299
val cropLeft: Int = (width - 2166)
val cropRight: Int = (width - 2294)
val cropTop: Int = (height - 2860)
val cropBottom: Int = (height - 2984)

val dirWithCroppedImages = File(dirWithImages, "cropped")
dirWithCroppedImages.mkdirs()

val pageNumberRegex = "^.+-(\\d+)\\.png$".toRegex()
data class PageDto(val fileName: String, val width: Int, val height: Int, val pageNum: Int) {
    fun toJsonString(): String {
        return "        {\"fileName\": \"$fileName\", \"width\": $width, \"height\": $height, \"pageNum\": $pageNum }"
    }
}

val jsonContent = dirWithImages.listFiles().asSequence()
    .filter { it.name.endsWith(".png") }
    .map {origImgFile ->
        println("processing - ${origImgFile.name}")
        val image: BufferedImage = ImageIO.read(origImgFile)
        val croppedImage = image.getSubimage(cropLeft, cropTop, width - cropLeft - cropRight, height - cropTop - cropBottom)
        ImageIO.write(croppedImage, "png", File(dirWithCroppedImages, origImgFile.name))

        PageDto(
            fileName = origImgFile.name,
            width = image.width,
            height = image.height,
            pageNum = pageNumberRegex.matchEntire(origImgFile.name)!!.groupValues[1].toInt()
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
