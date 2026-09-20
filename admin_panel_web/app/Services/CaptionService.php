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
        $product->loadMissing('sizes');
        $sizes = $product->sizes->pluck('size')->implode(', ');
        $rate = $product->sizes->min('rate');

        return strtr($body, [
            '{design_number}' => $product->design_number ?: '-',
            '{product_name}' => $product->name,
            '{sizes}' => $sizes ?: '-',
            '{rate}' => $rate !== null ? number_format((float) $rate, 0) : '-',
            '{business_contact}' => (string) env('BUSINESS_CONTACT', ''),
            '{business_name}' => (string) env('BUSINESS_NAME', 'Ramchandra Dresses'),
        ]);
    }

    public function defaultBody(): string
    {
        return "Ramchandra Dresses\n"
            ."Design No.: {design_number}\n"
            ."Product: {product_name}\n"
            ."Available Sizes: {sizes}\n"
            ."Rate: ₹{rate} onwards\n"
            ."Contact: {business_contact}\n"
            ."Thank you for your enquiry. Please contact us for bulk orders and the latest collection.";
    }
}
