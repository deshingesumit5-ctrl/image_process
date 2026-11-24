<?php

namespace App\Services;

use App\Models\MessageTemplate;
use App\Models\Product;

class CaptionService
{
    public function forProduct(Product $product): string
    {
        $template = MessageTemplate::query()->first();
        $body = $template?->template_body ?: $this->defaultBody();
        $product->loadMissing(['sizes', 'category', 'subCategory']);
        $sizes = $product->sizes->pluck('size')->implode(', ');
        $rate = $product->sizes->min('rate');
        $categoryName = $product->category?->name ?: '';
        $subCategoryName = $product->subCategory?->name ?: '';
        $groupName = collect([$categoryName, $subCategoryName])->filter()->implode(' / ');

        return strtr($body, [
            '{design_number}' => $product->design_number ?: '-',
            '{product_name}' => $product->name,
            '{category}' => $categoryName ?: '-',
            '{sub_category}' => $subCategoryName ?: '-',
            '{group}' => $groupName ?: '-',
            '{colour}' => $product->colour ?: '-',
            '{sizes}' => $sizes ?: '-',
            '{rate}' => $rate !== null ? number_format((float) $rate, 0) : '-',
            '{business_contact}' => (string) env('BUSINESS_CONTACT', ''),
            '{business_name}' => (string) env('BUSINESS_NAME', 'Ramchandra Dresses'),
        ]);
    }

    public function defaultBody(): string
    {
        return "Ramchandra Dresses\n"
            ."Product: {product_name}\n"
            ."Category / Group: {group}\n"
            ."Design No.: {design_number}\n"
            ."Colour: {colour}\n"
            ."Available Sizes: {sizes}\n"
            ."Rate: ₹{rate} onwards\n"
            ."Contact: {business_contact}\n"
            ."Thank you for your enquiry. Please contact us for bulk orders and the latest collection.";
    }
}
