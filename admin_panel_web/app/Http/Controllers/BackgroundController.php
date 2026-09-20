<?php

namespace App\Http\Controllers;

use App\Models\Background;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BackgroundController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $orientation = $request->string('orientation')->toString();
        $backgrounds = Background::query()
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%")->orWhere('category_type', 'like', "%{$q}%"))
            ->when($orientation, fn ($query) => $query->where('orientation', $orientation))
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        return view('backgrounds.index', compact('backgrounds', 'q', 'orientation'));
    }

    public function create()
    {
        return view('backgrounds.form', ['background' => new Background(['status' => true, 'orientation' => 'vertical'])]);
    }

    public function store(Request $request, ImageProcessingService $processor)
    {
        $data = $this->validated($request, true);
        $fit = $processor->fitBackground($request->file('image'), $data['orientation']);
        Background::query()->create([
            ...$data,
            'status' => $request->boolean('status'),
            'image_path' => $fit['path'],
            'width' => $fit['width'],
            'height' => $fit['height'],
        ]);

        return redirect()->route('backgrounds.index')->with('success', 'Background created and available immediately.');
    }

    public function edit(Background $background)
    {
        return view('backgrounds.form', compact('background'));
    }

    public function update(Request $request, Background $background, ImageProcessingService $processor)
    {
        $data = $this->validated($request, false);
        $payload = [
            ...$data,
            'status' => $request->boolean('status'),
        ];
        if ($request->hasFile('image')) {
            $fit = $processor->fitBackground($request->file('image'), $data['orientation']);
            $payload['image_path'] = $fit['path'];
            $payload['width'] = $fit['width'];
            $payload['height'] = $fit['height'];
        }
        $background->update($payload);

        return redirect()->route('backgrounds.index')->with('success', 'Background updated.');
    }

    public function destroy(Background $background)
    {
        Storage::disk('public')->delete($background->image_path);
        $background->delete();

        return redirect()->route('backgrounds.index')->with('success', 'Background deleted.');
    }

    public function toggle(Background $background)
    {
        $background->update(['status' => ! $background->status]);

        return back()->with('success', 'Background status updated.');
    }

    private function validated(Request $request, bool $imageRequired): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category_type' => ['nullable', 'string', 'max:80'],
            'orientation' => ['required', 'in:horizontal,vertical'],
            'status' => ['nullable', 'boolean'],
            'image' => [$imageRequired ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);
    }
}
