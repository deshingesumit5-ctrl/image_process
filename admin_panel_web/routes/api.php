<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackgroundApiController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ProcessController;
use App\Http\Controllers\Api\ShareController;
use App\Http\Controllers\Api\ShortlistController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    Route::get('/categories', [CatalogController::class, 'categories'])->middleware('module:category');
    Route::get('/categories/{category}/sub-categories', [CatalogController::class, 'subCategories'])->middleware('module:category');
    Route::get('/products', [CatalogController::class, 'products'])->middleware('module:product');
    Route::get('/products/{product}', [CatalogController::class, 'show'])->middleware('module:product');

    Route::get('/backgrounds', [BackgroundApiController::class, 'index']);

    Route::get('/shortlist', [ShortlistController::class, 'show']);
    Route::post('/shortlist', [ShortlistController::class, 'add']);
    Route::post('/shortlist/remove', [ShortlistController::class, 'remove']);
    Route::post('/shortlist/empty', [ShortlistController::class, 'empty']);

    Route::post('/share/captions', [ShareController::class, 'captions']);
    Route::post('/share', [ShareController::class, 'store']);

    Route::get('/process/recent', [ProcessController::class, 'recent']);
    Route::post('/process', [ProcessController::class, 'store']);
});
