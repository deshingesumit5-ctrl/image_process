<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('module_key');
            $table->string('label');
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->boolean('can_view')->default(false);
            $table->boolean('can_add')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('status')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('sub_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('status')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('sub_category_id')->constrained('sub_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('design_number')->nullable();
            $table->string('barcode')->nullable();
            $table->boolean('status')->default(true);
            $table->boolean('keep_original')->default(false);
            $table->enum('orientation', ['horizontal', 'vertical'])->default('vertical');
            $table->timestamps();
        });

        Schema::create('product_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('size');
            $table->decimal('rate', 10, 2);
        });

        Schema::create('backgrounds', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category_type')->nullable();
            $table->string('image_path');
            $table->enum('orientation', ['horizontal', 'vertical'])->default('vertical');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('original_path');
            $table->string('processed_path')->nullable();
            $table->boolean('is_processed')->default(false);
            $table->foreignId('background_id')->nullable()->constrained('backgrounds')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('shortlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('shortlist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shortlist_id')->constrained('shortlists')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_image_id')->nullable()->constrained('product_images')->nullOnDelete();
            $table->unique(['shortlist_id', 'product_id', 'product_image_id'], 'shortlist_item_unique');
        });

        Schema::create('share_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->json('product_ids');
            $table->string('shared_via')->default('whatsapp');
            $table->timestamp('shared_at')->useCurrent();
        });

        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('template_body');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('processing_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('image_count')->default(1);
            $table->string('source')->default('app');
            $table->timestamp('processed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processing_logs');
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('share_history');
        Schema::dropIfExists('shortlist_items');
        Schema::dropIfExists('shortlists');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('backgrounds');
        Schema::dropIfExists('product_sizes');
        Schema::dropIfExists('products');
        Schema::dropIfExists('sub_categories');
        Schema::dropIfExists('categories');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
        });
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
