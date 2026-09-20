<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MessageTemplate;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SubCategory;
use App\Models\User;
use App\Services\CaptionService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'category' => 'Category Master',
            'sub_category' => 'Sub-Category Master',
            'product' => 'Product Master',
            'background' => 'Background Master',
            'roles' => 'Roles & Access',
            'users' => 'User Master',
            'share' => 'Share Product',
            'reports' => 'Reports',
            'processing' => 'Image Processing',
        ];

        $permissions = [];
        foreach ($modules as $key => $label) {
            $permissions[$key] = Permission::query()->firstOrCreate(
                ['module_key' => $key],
                ['label' => $label]
            );
        }

        $adminRole = Role::query()->firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Full access', 'status' => true]
        );
        $manager = Role::query()->firstOrCreate(
            ['name' => 'Manager'],
            ['description' => 'Catalog and reports', 'status' => true]
        );
        $sales = Role::query()->firstOrCreate(
            ['name' => 'Sales Staff'],
            ['description' => 'Browse, shortlist, share, process', 'status' => true]
        );

        foreach ($permissions as $permission) {
            RolePermission::query()->updateOrCreate(
                ['role_id' => $adminRole->id, 'permission_id' => $permission->id],
                ['can_view' => true, 'can_add' => true, 'can_edit' => true, 'can_delete' => true]
            );
        }

        $managerKeys = ['category', 'sub_category', 'product', 'background', 'share', 'reports', 'processing'];
        foreach ($permissions as $key => $permission) {
            $allowed = in_array($key, $managerKeys, true);
            RolePermission::query()->updateOrCreate(
                ['role_id' => $manager->id, 'permission_id' => $permission->id],
                [
                    'can_view' => $allowed,
                    'can_add' => $allowed && $key !== 'reports',
                    'can_edit' => $allowed && $key !== 'reports',
                    'can_delete' => false,
                ]
            );
        }

        $salesKeys = ['category', 'sub_category', 'product', 'processing'];
        foreach ($permissions as $key => $permission) {
            $allowed = in_array($key, $salesKeys, true);
            RolePermission::query()->updateOrCreate(
                ['role_id' => $sales->id, 'permission_id' => $permission->id],
                [
                    'can_view' => $allowed,
                    'can_add' => false,
                    'can_edit' => false,
                    'can_delete' => false,
                ]
            );
        }

        User::query()->updateOrCreate(
            ['email' => 'admin@image.test'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'status' => true,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'sales@image.test'],
            [
                'name' => 'Sales Staff',
                'password' => 'password',
                'role_id' => $sales->id,
                'status' => true,
            ]
        );

        $catalog = [
            'Gents Shirt' => ['Traffic', 'Active', 'Premium', 'Casual'],
            'Gents Short' => ['Denim', 'Cotton'],
            'Ladies Wear' => ['Premium', 'Casual'],
            'Winter Sweater' => ['Traffic', 'Wool'],
            'Kids Wear' => ['Casual', 'Party'],
        ];

        foreach ($catalog as $catName => $subs) {
            $category = Category::query()->firstOrCreate(['name' => $catName], ['status' => true]);
            foreach ($subs as $subName) {
                $sub = SubCategory::query()->firstOrCreate(
                    ['category_id' => $category->id, 'name' => $subName],
                    ['status' => true]
                );
                Product::query()->firstOrCreate(
                    ['design_number' => strtoupper(substr($catName, 0, 2)).'-'.strtoupper(substr($subName, 0, 3)).'-01'],
                    [
                        'category_id' => $category->id,
                        'sub_category_id' => $sub->id,
                        'name' => $catName.' '.$subName.' Sample',
                        'barcode' => '890'.str_pad((string) $sub->id, 7, '0', STR_PAD_LEFT),
                        'status' => true,
                        'keep_original' => false,
                        'orientation' => 'vertical',
                    ]
                );
            }
        }

        Product::query()->get()->each(function (Product $product) {
            if ($product->sizes()->exists()) {
                return;
            }
            $product->sizes()->createMany([
                ['size' => 'M', 'rate' => 450],
                ['size' => 'L', 'rate' => 470],
                ['size' => 'XL', 'rate' => 490],
            ]);
        });

        MessageTemplate::query()->firstOrCreate(
            ['name' => 'WhatsApp Product Share'],
            ['template_body' => (new CaptionService)->defaultBody()]
        );

        $this->call(BackgroundSeeder::class);
    }
}
