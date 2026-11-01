package com.msbook.app.domain.model

/**
 * Supported business categories for MSbook.
 */
enum class BusinessType(val title: String, val description: String) {
    KIRANA("Kirana / General Store", "Provisions, grocery, FMCG & daily essentials store"),
    CLOTHING("Clothing / Men's Wear", "Apparel, menswear, garments & fabric retail");

    companion object {
        fun fromString(value: String): BusinessType {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: KIRANA
        }
    }
}
