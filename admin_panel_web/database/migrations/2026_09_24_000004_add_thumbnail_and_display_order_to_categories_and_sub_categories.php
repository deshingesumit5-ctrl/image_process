<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'image_path')) {
                $table->string('image_path')->nullable()->after('name');
            }
            if (!Schema::hasColumn('categories', 'display_order')) {
                $table->integer('display_order')->default(1)->after('image_path');
            }
        });

        Schema::table('sub_categories', function (Blueprint $table) {
            if (!Schema::hasColumn('sub_categories', 'image_path')) {
                $table->string('image_path')->nullable()->after('name');
            }
            if (!Schema::hasColumn('sub_categories', 'display_order')) {
                $table->integer('display_order')->default(1)->after('image_path');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'display_order')) {
                $table->integer('display_order')->default(1)->after('barcode');
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['image_path', 'display_order']);
        });

        Schema::table('sub_categories', function (Blueprint $table) {
            $table->dropColumn(['image_path', 'display_order']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['display_order']);
        });
    }
};
