<?php

namespace App\Http\Controllers;

use App\Models\MessageTemplate;
use App\Services\CaptionService;
use Illuminate\Http\Request;

class MessageTemplateController extends Controller
{
    public function edit(CaptionService $captions)
    {
        $template = MessageTemplate::query()->first()
            ?? MessageTemplate::query()->create([
                'name' => 'WhatsApp Product Share',
                'template_body' => $captions->defaultBody(),
            ]);

        return view('share-template.edit', compact('template'));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'template_body' => ['required', 'string'],
        ]);
        $template = MessageTemplate::query()->first();
        $template?->update($data);

        return back()->with('success', 'Share template saved. The app will use this immediately.');
    }
}
