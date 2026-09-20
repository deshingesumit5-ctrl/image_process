<?php

use App\Http\Controllers\AdminProcessController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BackgroundController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MessageTemplateController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SubCategoryController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('dashboard'));

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::middleware('module:category')->group(function () {
        Route::resource('categories', CategoryController::class)->except('show');
        Route::post('categories/{category}/toggle', [CategoryController::class, 'toggle'])->name('categories.toggle');
    });

    Route::middleware('module:sub_category')->group(function () {
        Route::resource('sub-categories', SubCategoryController::class)->except('show');
    });

    Route::middleware('module:product')->group(function () {
        Route::resource('products', ProductController::class)->except('show');
        Route::delete('products/{product}/images/{image}', [ProductController::class, 'destroyImage'])->name('products.images.destroy');
        Route::get('products/{product}/process', [AdminProcessController::class, 'create'])->name('products.process');
        Route::post('products/{product}/process', [AdminProcessController::class, 'store'])->name('products.process.store');
    });

    Route::middleware('module:background')->group(function () {
        Route::resource('backgrounds', BackgroundController::class)->except('show');
        Route::post('backgrounds/{background}/toggle', [BackgroundController::class, 'toggle'])->name('backgrounds.toggle');
    });

    Route::middleware('module:roles')->group(function () {
        Route::resource('roles', RoleController::class)->except('show');
    });

    Route::middleware('module:users')->group(function () {
        Route::resource('users', UserController::class)->except('show');
    });

    Route::middleware('module:share')->group(function () {
        Route::get('share-template', [MessageTemplateController::class, 'edit'])->name('share-template.edit');
        Route::put('share-template', [MessageTemplateController::class, 'update'])->name('share-template.update');
    });

    Route::middleware('module:reports')->group(function () {
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    });
});
