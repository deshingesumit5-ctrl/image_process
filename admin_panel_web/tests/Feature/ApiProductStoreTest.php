<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\SubCategory;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiProductStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_products_store_creates_product_with_sizes_and_image_and_lists_it(): void
    {
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');

        $user = User::query()->where('email', 'admin@image.test')->firstOrFail();
        Sanctum::actingAs($user);

        $category = Category::query()->firstOrFail();
        $subCategory = SubCategory::query()->where('category_id', $category->id)->firstOrFail();

        $image = UploadedFile::fake()->image('jacket.png', 600, 800);

        $response = $this->post('/api/products', [
            'category_id' => $category->id,
            'sub_category_id' => $subCategory->id,
            'name' => "Men's white and Blue Sports Jacket",
            'design_number' => 'SJ-001',
            'colour' => 'White and Blue',
            'barcode' => 'SJ0012026',
            'display_order' => 1,
            'keep_original' => '1',
            'orientation' => 'vertical',
            'status' => '1',
            'sizes' => [
                ['size' => 'M', 'rate' => '450'],
                ['size' => 'L', 'rate' => '470'],
            ],
            'images' => [$image],
        ], ['Accept' => 'application/json']);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', "Men's white and Blue Sports Jacket")
            ->assertJsonPath('data.design_number', 'SJ-001')
            ->assertJsonPath('data.colour', 'White and Blue')
            ->assertJsonPath('data.barcode', 'SJ0012026')
            ->assertJsonPath('data.keep_original', true)
            ->assertJsonPath('data.orientation', 'vertical')
            ->assertJsonCount(2, 'data.sizes')
            ->assertJsonCount(1, 'data.images');

        $created = Product::query()->where('design_number', 'SJ-001')->first();
        $this->assertNotNull($created);
        $this->assertTrue($created->status);
        $this->assertCount(2, $created->sizes);
        $this->assertCount(1, $created->images);

        Storage::disk('public')->assertExists($created->images->first()->processed_path);

        // Verify the created product appears in Product Master API list
        $listResponse = $this->getJson('/api/products');
        $listResponse->assertStatus(200)
            ->assertJsonFragment([
                'id' => $created->id,
                'name' => "Men's white and Blue Sports Jacket",
                'design_number' => 'SJ-001',
            ]);
    }
}
