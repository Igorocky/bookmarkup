import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

val projName = "basic-trig-identities"
val dirWithOriginalImages = File("C:\\igye\\books\\tmp")
val outputDir = File("C:\\igye\\books\\tmp\\basic-trig-identities-prepared")
val width: Int = 2550
val height: Int = 3299
val cropLeft: Int = (width - 2166)
val cropRight: Int = (width - 2294)
val cropTop: Int = (height - 2860)
val cropBottom: Int = (height - 2984)

outputDir.mkdirs()

val dirWithCroppedImages = File(outputDir, projName + "-img")
dirWithCroppedImages.mkdirs()

val pagesFile = File(outputDir, "$projName.json")
val repeatGroupsFile = File(outputDir, "$projName-repeat-groups.json")
val selectionsFile = File(outputDir, "$projName-selections.json")
val projConfigFile = File(outputDir, "config-content.json")

val pageNumberRegex = "^.+-(\\d+)\\.png$".toRegex()
data class PageDto(val fileName: String, val width: Int, val height: Int, val pageNum: Int) {
    fun toJsonString(): String {
        return "        {\"fileName\": \"$fileName\", \"width\": $width, \"height\": $height, \"pageNum\": $pageNum }"
    }
}

val jsonContent = dirWithOriginalImages.listFiles().asSequence()
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
pagesFile.writeText(jsonContent)

repeatGroupsFile.writeText("""
    {
        "COLLECTIONS": [],
        "SELECTED_COLLECTION_IDX": 0
    }
""".trimIndent())

selectionsFile.writeText("[]")

projConfigFile.writeText("""
    {
      "environmentName": "PROD",
      "markups": [
        {
          "id": "$projName",
          "title": "",
          "bookFile": "$projName.json",
          "imgDir": "$projName-img",
          "imgHash": "[]",
          "selectionsFile": "$projName-selections.json",
    	  "repeatGroupsFile": "$projName-repeat-groups.json",
    	  "defaultTags": []
        }
      ]
    }
""".trimIndent())